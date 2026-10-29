// Passage: expo-audio 1.1.1 Now Playing concurrency repair.
// All metadata, artwork state, and remote commands are confined to the main queue.
import MediaPlayer
import AVFoundation
import ExpoModulesCore

class MediaController {
  static let shared = MediaController()

  private var activePlayer: AudioPlayer?
  private let remoteCommandCenter = MPRemoteCommandCenter.shared()
  private let nowPlayingInfoCenter = MPNowPlayingInfoCenter.default()
  private var currentArtworkUrl: URL?
  private var currentItem: AVPlayerItem?
  private var cachedArtwork: MPMediaItemArtwork?
  private var artworkTask: URLSessionDataTask?
  private var artworkGeneration = 0
  private var artworkRetryAt = Date.distantPast
  private var commandTargets: [(MPRemoteCommand, Any)] = []

  func setActivePlayer(_ player: AudioPlayer?, options: LockScreenOptions? = nil) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.setActivePlayer(player, options: options) }
      return
    }
    guard player?.passageIsReleased != true else { return }
    if activePlayer?.id != player?.id {
      activePlayer?.isActiveForLockScreen = false
      resetArtwork()
      nowPlayingInfoCenter.nowPlayingInfo = nil
    }
    activePlayer = player
    player?.isActiveForLockScreen = true
    disableRemoteCommands()
    if let player {
      enableRemoteCommands(options: options)
      updateNowPlayingInfo(for: player)
    } else {
      clearNowPlayingInfo()
    }
  }

  // A delayed cleanup for an old player must not clear a newer player's controls.
  func clearPlayer(_ player: AudioPlayer) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.clearPlayer(player) }
      return
    }
    player.metadata = nil
    player.isActiveForLockScreen = false
    if activePlayer?.id == player.id { setActivePlayer(nil) }
  }

  func updateNowPlayingInfo(for player: AudioPlayer) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { [weak self, weak player] in
        guard let player else { return }
        self?.updateNowPlayingInfo(for: player)
      }
      return
    }
    guard !player.passageIsReleased, player.id == activePlayer?.id else { return }

    let item = player.ref.currentItem
    let artworkUrl = player.metadata?.artworkUrl
    if currentItem !== item || currentArtworkUrl != artworkUrl {
      resetArtwork()
      currentItem = item
      currentArtworkUrl = artworkUrl
    }

    // Rebuild from the current player; never publish a dictionary captured by an
    // older asynchronous download (including its old elapsed time/title).
    var info: [String: Any] = [
      MPNowPlayingInfoPropertyPlaybackRate: player.isPlaying ? player.ref.rate : 0.0,
      MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue
    ]
    if player.duration.isFinite {
      info[MPMediaItemPropertyPlaybackDuration] = max(0, player.duration)
    }
    if player.currentTime.isFinite {
      info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = max(0, player.currentTime)
    }
    if let metadata = player.metadata {
      info[MPMediaItemPropertyTitle] = metadata.title
      info[MPMediaItemPropertyArtist] = metadata.artist
      info[MPMediaItemPropertyAlbumTitle] = metadata.albumTitle
    }
    if let cachedArtwork { info[MPMediaItemPropertyArtwork] = cachedArtwork }
    nowPlayingInfoCenter.nowPlayingInfo = info

    if let artworkUrl, cachedArtwork == nil, artworkTask == nil, Date() >= artworkRetryAt {
      loadArtwork(url: artworkUrl, player: player, item: item)
    }
  }

  func clearNowPlayingInfo() {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.clearNowPlayingInfo() }
      return
    }
    activePlayer?.isActiveForLockScreen = false
    activePlayer = nil
    resetArtwork()
    disableRemoteCommands()
    nowPlayingInfoCenter.nowPlayingInfo = nil
  }

  private func resetArtwork() {
    artworkGeneration += 1
    artworkTask?.cancel()
    artworkTask = nil
    currentArtworkUrl = nil
    currentItem = nil
    cachedArtwork = nil
    artworkRetryAt = .distantPast
  }

  private func loadArtwork(url: URL, player: AudioPlayer, item: AVPlayerItem?) {
    let generation = artworkGeneration
    // Local cached covers cannot be loaded with an HTTP data task. Both local
    // disk reads and decoding run off the main thread.
    let complete: (Data?) -> Void = { [weak self, weak player, weak item] data in
      let image = data.flatMap { UIImage(data: $0) }
      DispatchQueue.main.async {
        guard let self, let player, !player.passageIsReleased,
          self.artworkGeneration == generation,
          self.activePlayer?.id == player.id,
          player.ref.currentItem === item,
          self.currentArtworkUrl == url else { return }
        self.artworkTask = nil
        if let image {
          self.cachedArtwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        } else {
          // Failed downloads are retried with a delay, never at every status tick.
          self.artworkRetryAt = Date().addingTimeInterval(30)
        }
        self.updateNowPlayingInfo(for: player)
      }
    }
    // Also serves as an in-flight guard for local reads.
    artworkRetryAt = .distantFuture
    if url.isFileURL {
      DispatchQueue.global(qos: .utility).async { complete(try? Data(contentsOf: url)) }
    } else {
      var request = URLRequest(url: url)
      request.timeoutInterval = 15
      artworkTask = URLSession.shared.dataTask(with: request) { data, response, error in
        let status = (response as? HTTPURLResponse)?.statusCode ?? 200
        complete(error == nil && (200..<300).contains(status) ? data : nil)
      }
      artworkTask?.resume()
    }
  }

  private func addCommand(_ command: MPRemoteCommand, action: @escaping (AudioPlayer, MPRemoteCommandEvent) -> Void) {
    let target = command.addTarget { [weak self] event in
      // The callback's queue is not guaranteed to be the main queue.
      DispatchQueue.main.async {
        guard let player = self?.activePlayer, !player.passageIsReleased else { return }
        action(player, event)
      }
      return .success
    }
    commandTargets.append((command, target))
  }

  private func enableRemoteCommands(options: LockScreenOptions?) {
    addCommand(remoteCommandCenter.playCommand) { player, _ in
      player.play(at: player.currentRate > 0 ? player.currentRate : 1.0)
    }
    addCommand(remoteCommandCenter.pauseCommand) { player, _ in player.ref.pause() }
    addCommand(remoteCommandCenter.togglePlayPauseCommand) { player, _ in
      if player.isPlaying { player.ref.pause() }
      else { player.play(at: player.currentRate > 0 ? player.currentRate : 1.0) }
    }
    addCommand(remoteCommandCenter.changePlaybackPositionCommand) { player, event in
      guard let event = event as? MPChangePlaybackPositionCommandEvent else { return }
      player.ref.seek(to: CMTime(seconds: event.positionTime, preferredTimescale: 1))
    }
    remoteCommandCenter.skipForwardCommand.preferredIntervals = [10.0]
    remoteCommandCenter.skipBackwardCommand.preferredIntervals = [10.0]
    addCommand(remoteCommandCenter.skipForwardCommand) { player, event in
      guard let event = event as? MPSkipIntervalCommandEvent else { return }
      let target = player.ref.currentTime() + CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: target, toleranceBefore: .zero, toleranceAfter: .zero)
    }
    addCommand(remoteCommandCenter.skipBackwardCommand) { player, event in
      guard let event = event as? MPSkipIntervalCommandEvent else { return }
      let target = player.ref.currentTime() - CMTime(seconds: event.interval, preferredTimescale: 1)
      player.ref.seek(to: target, toleranceBefore: .zero, toleranceAfter: .zero)
    }
    remoteCommandCenter.playCommand.isEnabled = true
    remoteCommandCenter.pauseCommand.isEnabled = true
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = true
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = true
    remoteCommandCenter.skipForwardCommand.isEnabled = options?.showSeekForward ?? false
    remoteCommandCenter.skipBackwardCommand.isEnabled = options?.showSeekBackward ?? false
  }

  private func disableRemoteCommands() {
    for (command, target) in commandTargets { command.removeTarget(target) }
    commandTargets.removeAll()
    remoteCommandCenter.playCommand.isEnabled = false
    remoteCommandCenter.pauseCommand.isEnabled = false
    remoteCommandCenter.togglePlayPauseCommand.isEnabled = false
    remoteCommandCenter.changePlaybackPositionCommand.isEnabled = false
    remoteCommandCenter.skipForwardCommand.isEnabled = false
    remoteCommandCenter.skipBackwardCommand.isEnabled = false
  }
}
