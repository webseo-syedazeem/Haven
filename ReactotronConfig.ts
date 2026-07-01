import Reactotron from 'reactotron-react-native';

if (__DEV__) {
  Reactotron
    .configure({ name: 'Steadia App' })
    .useReactNative({
      asyncStorage: true,
      networking: {
        ignoreUrls: /symbolicate/,
      },
    })
    .connect();
}

export default Reactotron;
