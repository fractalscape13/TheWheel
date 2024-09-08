import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';

const Touchable: React.FC<TouchableOpacityProps> = ({ children, ...props }) => {
  return (
    <TouchableOpacity activeOpacity={0.7} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default Touchable;
