import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme } from 'tamagui';
import { NavigationContainer } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
// import { MMKV } from 'react-native-mmkv';
// import { APP_THEME } from './src/constants';
import Navigation from './src/navigation';
import config from './tamagui.config';

// export const storage = new MMKV();

// const getStoredTheme = () => storage.getString(APP_THEME);

// const setInitialTheme = (systemTheme: string | undefined | null) => {
//   const storedTheme = getStoredTheme();
//   if (!storedTheme && systemTheme) {
//     const initialTheme = systemTheme === 'dark' ? 'dark' : 'light';
//     storage.set(APP_THEME, initialTheme);
//     return initialTheme;
//   }
//   return storedTheme || 'light';
// };

const App = () => {
  const systemTheme = useColorScheme();
  // const [appTheme, setAppTheme] = useState(setInitialTheme(systemTheme));
  const [appTheme, setAppTheme] = useState(systemTheme);

  // useEffect(() => {
  //   const storedTheme = getStoredTheme();
  //   if (storedTheme) {
  //     setAppTheme(storedTheme);
  //   }
  // }, []);

  const toggleTheme = () => {
    const newTheme = appTheme === 'light' ? 'dark' : 'light';
    setAppTheme(newTheme);
    // storage.set(APP_THEME, newTheme);
  };

  return (
    <TamaguiProvider config={config} defaultTheme={appTheme}>
      <SafeAreaProvider>
        <Theme name={appTheme}>
          <NavigationContainer>
            <Navigation toggleTheme={toggleTheme} />
          </NavigationContainer>
        </Theme>
      </SafeAreaProvider>
    </TamaguiProvider>
  );
};

export default App;
