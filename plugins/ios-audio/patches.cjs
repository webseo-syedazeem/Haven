// Small, version-pinned backport for expo-audio 1.1.1. Keep the JS public API.
// Main-thread artwork confinement follows expo/expo#44498. Session work is
// explicitly awaited by our engine; keepAudioSessionActive avoids sync activation.
const playerEdits = [
  ['  let id = UUID().uuidString', `  // Passage: guard queued metadata callbacks after SharedObject release.
  private let passageLifetimeLock = NSLock()
  private var passageReleased = false
  var passageIsReleased: Bool {
    passageLifetimeLock.lock()
    defer { passageLifetimeLock.unlock() }
    return passageReleased
  }
  let id = UUID().uuidString`],
  [`    if isActiveForLockScreen {
      MediaController.shared.updateNowPlayingInfo(for: self)
    }`, '    MediaController.shared.updateNowPlayingInfo(for: self)', 2],
  [`    self.metadata = metadata
    if active {
      MediaController.shared.setActivePlayer(self, options: options)
    } else {
      MediaController.shared.setActivePlayer(nil)
    }`, `    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.setActiveForLockScreen(active, metadata: metadata, options: options) }
      return
    }
    guard !passageIsReleased else { return }
    self.metadata = metadata
    if active {
      MediaController.shared.setActivePlayer(self, options: options)
    } else {
      MediaController.shared.clearPlayer(self)
    }`],
  ['  public override func sharedObjectWillRelease() {', `  public override func sharedObjectWillRelease() {
    passageLifetimeLock.lock()
    passageReleased = true
    passageLifetimeLock.unlock()`],
  [`    if isActiveForLockScreen {
      MediaController.shared.setActivePlayer(nil)
    }`, '    MediaController.shared.clearPlayer(self)'],
];

const moduleEdits = [
  ['  private var sessionIsActive = true', `  // Passage: potentially blocking audio-session work has a dedicated queue.
  // Never dispatch_sync to this queue from JS/main/the shared Expo async queue.
  private let audioSessionQueue = DispatchQueue(label: "passage.audio.session")
  private var interruptionGeneration = 0 // main queue only
  private var sessionIsActive = true`],
  [`    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }`, `    AsyncFunction("setAudioModeAsync") { (mode: AudioMode) in
      try setAudioMode(mode: mode)
    }.runOnQueue(audioSessionQueue)`],
  [`    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      try setIsAudioActive(isActive)
    }`, `    AsyncFunction("setIsAudioActiveAsync") { (isActive: Bool)  in
      try setIsAudioActive(isActive)
    }.runOnQueue(audioSessionQueue)`],
  [`      Function("play") { player in
        try activateSession()`, `      Function("play") { player in
        // Passage's engine explicitly awaits setIsAudioActiveAsync before play.
        // Preserve stock behavior for consumers that do not opt into this contract.
        if !player.keepAudioSessionActive { try activateSession() }`],
  [`      Function("pause") { player in
        player.ref.pause()`, `      Function("pause") { player in
        DispatchQueue.main.async { self.interruptedPlayers.remove(player.id) }
        player.ref.pause()`],
  [`        if player.isActiveForLockScreen {
          player.metadata = metadata
          MediaController.shared.updateNowPlayingInfo(for: player)
        }`, `        DispatchQueue.main.async {
          guard !player.passageIsReleased, player.isActiveForLockScreen else { return }
          player.metadata = metadata
          MediaController.shared.updateNowPlayingInfo(for: player)
        }`],
  [`        if player.isActiveForLockScreen {
          player.metadata = nil
          player.isActiveForLockScreen = false
          MediaController.shared.setActivePlayer(nil)
        }`, '        MediaController.shared.clearPlayer(player)'],
  ['  private func handleInterruptionBegan() {', `  private func handleInterruptionBegan() {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.handleInterruptionBegan() }
      return
    }
    interruptionGeneration += 1`],
  [`  private func handleInterruptionEnded(with options: AVAudioSession.InterruptionOptions) {
    do {
      try AVAudioSession.sharedInstance().setActive(true)
      if options.contains(.shouldResume) {
        resumeInterruptedPlayers()
      }
    } catch {
      print("Failed to reactivate audio session: \\(error)")
    }
  }`, `  private func handleInterruptionEnded(with options: AVAudioSession.InterruptionOptions) {
    guard Thread.isMainThread else {
      DispatchQueue.main.async { self.handleInterruptionEnded(with: options) }
      return
    }
    let generation = interruptionGeneration
    audioSessionQueue.async { [weak self] in
      do {
        try AVAudioSession.sharedInstance().setActive(true)
        DispatchQueue.main.async {
          guard let self, self.interruptionGeneration == generation else { return }
          if options.contains(.shouldResume) { self.resumeInterruptedPlayers() }
        }
      } catch {
        print("Failed to reactivate audio session: \\(error)")
      }
    }
  }`],
  ['    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in',
    '    audioSessionQueue.asyncAfter(deadline: .now() + 0.1) { [weak self] in'],
];

function applyEdits(source, edits) {
  let result = source;
  for (const [before, after, expected = 1] of edits) {
    const pattern = new RegExp('^' + before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gm');
    const count = [...result.matchAll(pattern)].length;
    if (count !== expected) {
      throw new Error(`expo-audio native source changed: expected ${expected} matches, got ${count}: ${before.slice(0, 90)}`);
    }
    result = result.replace(pattern, () => after);
  }
  return result;
}

module.exports = { playerEdits, moduleEdits, applyEdits };
