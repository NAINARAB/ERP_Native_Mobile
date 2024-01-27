import React, { useState } from 'react';
import { View, Text, SafeAreaView, TextInput } from 'react-native';
import { Button } from 'react-native-paper'
import { LinearGradient } from 'react-native-linear-gradient';
import { Divider } from 'react-native-elements';
import apiAddress from './apiAddress';
import AsyncStorage from '@react-native-async-storage/async-storage';
import styles from './style';

const LoginComponent = ({ setLoginTrue, navigation }) => {
    const [inputValue, setInputValue] = useState({});

    const loginFunction = () => {
        if ((inputValue?.mobile && inputValue?.mobile !== '') && (inputValue?.password && inputValue?.password !== '')) {
            fetch(`${apiAddress}api/login?user=${inputValue?.mobile}&pass=${inputValue?.password}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
            }).then(res => { return res.json() })
                .then(data => {
                    if (data.status === 'Success') {
                        setInputValue({});
                        setData(data)
                    } else {
                        alert(data.message);
                    }
                }).catch(e => console.log(e))
        } else {
            if(!inputValue?.mobile || inputValue?.mobile === ''){
                alert('Enter Mobile Number');
            }
            else if(!inputValue?.password || inputValue?.password === ''){
                alert('Enter Password');
            }
        }
    }

    const setData = async (data) => {
        try {
            await AsyncStorage.setItem('userToken', data.user.Autheticate_Id);
            await AsyncStorage.setItem('Name', data.user.Name);
            await AsyncStorage.setItem('UserType', data.user.UserType);
            await AsyncStorage.setItem('UserId', data.user.UserId);
            await AsyncStorage.setItem('branchId', String(data.user.BranchId));
            await AsyncStorage.setItem('loginResponse', JSON.stringify(data.sessionInfo));
            await AsyncStorage.setItem('uType', data.user.UserTypeId);
            setLoginTrue();
        } catch (e) {
            console.log(e);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient
                colors={['#3498db', '#2980b9', '#2c3e50']}
                style={styles.gradientContainer}>
                <View style={styles.contentContainer}>
                    <View style={styles.card}>
                        <Text style={styles.welcome}>SMT ERP LOGIN</Text>
                        <Text style={styles.instructions}>To get started, log in to your Account</Text>
                        <Text style={styles.label}>Mobile</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={(e) => setInputValue({ ...inputValue, mobile: e })}
                            value={inputValue?.mobile} />
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            secureTextEntry={true}
                            style={styles.input}
                            onChangeText={(e) => setInputValue({ ...inputValue, password: e })}
                            value={inputValue?.password} />
                        <Divider style={{ backgroundColor: 'black', marginBottom: 20 }} />
                        <Button
                            title="Login"
                            mode="contained"
                            onPress={loginFunction}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                        > LOGIN</Button>
                    </View>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};

export default LoginComponent;
