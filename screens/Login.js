import React from 'react';
import {View, Text, ImageBackground, StyleSheet, Image, TouchableOpacity, Alert, KeyboardAvoidingView} from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import {getAuth, signInWithEmailAndPassword} from "firebase/auth";

const bgImage = require("../assets/background1.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class Login extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: ""
        };
    }

    handleLogin=(email,password)=>{
        
    }
    render(){
        const {email, password} = this.state;
        return(
           
        )
    }
}

const styles = StyleSheet.create({
   
});
