import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

export * from './avatar';
export * from './badge';
export * from './breadcrumbs';
export * from './button';
export * from './card';
export * from './checkbox';
export { default as colors } from './colors';
export * from './container';
export * from './focus-aware-status-bar';
export * from './global-loading';
export * from './image';
export * from './input';
export * from './list';
export * from './modal';
export * from './notifications';
export * from './offline-status';
export * from './progress-bar';
export * from './select';
export * from './skeleton';
export * from './text';
export * from './utils';

// export base components from react-native
export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
export { SafeAreaView } from 'react-native-safe-area-context';

//Apply cssInterop to Svg to resolve className string into style
cssInterop(Svg, {
  className: {
    target: 'style',
  },
});
