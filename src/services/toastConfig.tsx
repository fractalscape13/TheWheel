import React from "react";
import { Text, StyleSheet, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

const toastConfig = {
  error: ({ text1 }: any) => (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        console.log("Error Toast");
        Toast.hide();
      }}
    >
      <Ionicons name="warning-outline" size={24} color="red" />
      <Text style={styles.text}>{text1}</Text>
    </TouchableOpacity>
  ),
  success: ({ text1 }: any) => (
    <TouchableOpacity
      style={[styles.container, { borderColor: `${"green"}80` }]}
      onPress={() => {
        console.log("Success Toast");
        Toast.hide();
      }}
    >
      <View style={{ justifyContent: "flex-start", flex: 1 }}>
        <Ionicons name="checkmark-circle-outline" size={24} color="green" />
      </View>
      <Text style={styles.text}>{text1}</Text>
    </TouchableOpacity>
  ),
  info: ({ text1 }: any) => (
    <TouchableOpacity
      style={[styles.container, { borderColor: "blue" }]}
      onPress={() => {
        console.log("Info Toast");
        Toast.hide();
      }}
    >
      <Ionicons name="information-circle-outline" size={24} color="blue" />
      <Text style={styles.text}>{text1}</Text>
    </TouchableOpacity>
  ),
};

export const showErrorToast = (errorCode: string) => {
  return Toast.show({
    type: "error",
    text1: errorCode,
  });
};

export const showSuccessToast = (message: string) => {
  return Toast.show({
    type: "success",
    text1: message,
  });
};

export const showInfoToast = (infoMessage: string) => {
  return Toast.show({
    type: "info",
    text1: infoMessage,
  });
};

const styles = StyleSheet.create({
  container: {
    top: 10,
    minHeight: 45,
    width: "85%",
    padding: 10,
    backgroundColor: "white",
    borderWidth: 3,
    borderColor: "red",
    borderRadius: 15,
    justifyContent: "space-evenly",
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "black",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    justifyContent: "center",
    color: "black",
    fontSize: 13,
    fontWeight: "400",
    width: "90%",
    marginLeft: 10,
  },
});

export default toastConfig;
