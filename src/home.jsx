import React, { useEffect, useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, PermissionsAndroid, Image } from 'react-native';
import { LinearGradient } from 'react-native-linear-gradient';
import { Divider } from 'react-native-elements';
import apiAddress from './apiAddress';
import styles from './style';
import { Card, Dialog, Button as PaperButton, TextInput as TexInpt } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';

function formatDate(inputDate) {
    const date = new Date(inputDate);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    const formattedDate = `${day}-${month}-${year}`;
    return formattedDate;
}
function formatTime(inputTime) {
    const [hours, minutes, seconds] = inputTime.split(':');
    const dateObj = new Date(2000, 0, 1, hours, minutes, seconds);
    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    return formattedTime;
}

const HomeComponent = ({ setLoginFalse, navigation }) => {
    const [uName, setUname] = useState('')
    const [uRole, setURole] = useState('');
    const [uType, setUType] = useState('');
    const [token, setToken] = useState('');
    const [uId, setUId] = useState('');
    const [branch, setBranch] = useState('');
    const [SessionId, setSessionId] = useState('');
    const [loginInfo, setLoginInfo] = useState({});
    const [attendance, setAttanance] = useState([])
    const [dialog, setDialog] = useState(false)

    const [taskApp, setTaskApp] = useState(false)
    const [isEmp, setIsEmp] = useState(false)
    const [isCustomer, setIsCustomer] = useState(false)
    const [summary, setSummary] = useState('');
    const [refresh, setRefresh] = useState(false);

    const LeftContent = props => <Image {...props}
        source={require('../assets/user.png')}
        style={{ width: 35, height: 40, borderRadius: 15 }} />
    const RightContent = props =>
        <TouchableOpacity
            onPress={setLoginFalse}>
            <Image {...props}
                source={require('../assets/logout.png')}
                style={{ width: 35, height: 40, borderRadius: 15, marginRight: 10 }} />
        </TouchableOpacity>

    useEffect(() => {

        (async () => {
            try {
                const uname = await AsyncStorage.getItem('Name');
                const role = await AsyncStorage.getItem('UserType');
                const token = await AsyncStorage.getItem('userToken');
                const id = await AsyncStorage.getItem('UserId');
                const loginResponse = await AsyncStorage.getItem('loginResponse')
                const branch = await AsyncStorage.getItem('branchId')
                const uType = await AsyncStorage.getItem('uType')
                const parsed = JSON.parse(loginResponse)
                setSessionId(parsed.SessionId)
                setUname(uname); setURole(role); setToken(token); setUId(id);
                setLoginInfo(JSON.parse(loginResponse)); setBranch(branch); setUType(uType)
            } catch (e) {
                console.log(e)
            }
        })();

        (async () => {
            fetch(`${apiAddress}/api/pagerights?menuid=${13}&menutype=${2}&user=${await AsyncStorage.getItem('UserId')}`, {
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                    'Authorization': await AsyncStorage.getItem('userToken'),
                }
            })
                .then((res) => res.json())
                .then((data) => {
                    setTaskApp(data?.data[0]?.Add_Rights === 1)
                })
        })();

        (async () => {
            fetch(`${apiAddress}/api/attendance?id=${await AsyncStorage.getItem('UserId')}`, { headers: { 'Authorization': await AsyncStorage.getItem('userToken') } })
                .then(res => { return res.json() })
                .then(data => {
                    setAttanance(data.status === 'Success' ? data.data : [])
                    setIsEmp(!(data.message === 'Not An Employee'))
                })
        })();

        (async () => {
            fetch(`${apiAddress}/api/isCustomer?UserId=${await AsyncStorage.getItem('UserId')}`, { 
                headers: { 'Authorization': await AsyncStorage.getItem('userToken') } 
            }).then(res => res.json())
                .then(data => {
                    if (data?.IsCustomer === true) {
                        setIsCustomer(true)
                    }
                }).catch(e => console.log(e))
        })();

    }, [refresh])

    const requestLocationPermission = async () => {
        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'ERP App Location Permission',
                    message:
                        'ERP App needs access to your camera ' +
                        'so you can register your attendance.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('You can use the Location');
                getCurrentLocation();
            } else {
                console.log('Location permission denied');
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                StartDay(latitude, longitude)
            },
            (error) => {
                console.error('Error getting location:', error);
                switch (error.code) {
                    case 1:
                        console.error('Location permission denied');
                        break;
                    case 2:
                        console.error('Position unavailable');
                        break;
                    case 3:
                        console.error('Request timeout');
                        break;
                    default:
                        console.error('An unknown error occurred');
                        break;
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const StartDay = async (lat, long) => {
        fetch(`${apiAddress}/api/attendance`, {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserId: uId,
                Latitude: lat,
                Longitude: long,
                Creater: 'Employee'
            })
        }).then(res => res.json())
            .then(data => {
                setRefresh(!refresh);
                if (data.status === 'Success') {
                    alert(data.message);
                } else {
                    alert(data.message);
                }
            })
            .catch(error => {
                console.error('Error in fetching data:', error);
            });
    };

    const EndDay = () => {
        if (summary) {
            fetch(`${apiAddress}/api/attendance`, {
                method: 'PUT',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    UserId: uId,
                    Work_Summary: summary
                })
            }).then(res => { return res.json() })
                .then(data => {
                    setRefresh(!refresh)
                    if (data.status === 'Success') {
                        alert(data.message)
                        dialogClose(); setRefresh(!refresh);
                    } else {
                        alert(data.message)
                    }
                })
        } else {
            alert('Enter Summary')
        }
    }

    const dialogClose = () => {
        setDialog(false)
        setSummary('')
    }


    return (
        <SafeAreaView style={styles.safeArea}>
            <LinearGradient colors={['#a29bfe', '#6c5ce7', '#fd79a8']} style={styles.gradientContainer2}>

                <Card style={{ borderRadius: 0 }}>
                    <Card.Title
                        title={uName}
                        subtitle={uRole}
                        left={LeftContent}
                        right={RightContent}
                        titleStyle={{ fontSize: 20, fontWeight: 'bold', color: 'blue' }}
                        subtitleStyle={{ width: '70%' }} />
                </Card>

                {isEmp &&
                    <View style={{ padding: 10, paddingBottom: 0 }}>

                        <Card>
                            <Card.Title
                                title={'Today Attendance'}
                                titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                                subtitleStyle={{ width: '70%' }} />

                            <Divider style={{ backgroundColor: 'black', }} />

                            <Card.Content style={{ marginTop: 10 }}>
                                <View style={styles.textView}>
                                    <Text style={styles.attendanceText1} >Start Date</Text>
                                    <Text style={styles.attendanceText2} >{attendance[0]?.Start_Date ? formatDate(attendance[0]?.Start_Date) : '--:--:--'}</Text>
                                </View>
                                <View style={styles.textView}>
                                    <Text style={styles.attendanceText1} >In Time</Text>
                                    <Text style={styles.attendanceText2} >{attendance[0]?.InTime ? formatTime(attendance[0]?.InTime) : '--:--:--'}</Text>
                                </View>
                                <View style={styles.textView}>
                                    <Text style={styles.attendanceText1} >Out Time</Text>
                                    <Text style={styles.attendanceText2} >{attendance[0]?.OutTime ? formatTime(attendance[0]?.OutTime) : '--:--:--'}</Text>
                                </View>
                                <View style={styles.textView}>
                                    <Text style={styles.attendanceText1} >Out Date</Text>
                                    <Text style={styles.attendanceText2} >{attendance[0]?.OutDate ? formatDate(attendance[0]?.OutDate) : '--:--:--'}</Text>
                                </View>
                            </Card.Content>

                            <Divider style={{ backgroundColor: 'black', }} />

                            <Card.Actions>
                                {attendance.length > 0 &&
                                    <PaperButton
                                        disabled={(attendance.length > 0) && (attendance[0]?.Current_St === 1)}
                                        onPress={() => setDialog(true)}>End Day</PaperButton>
                                }
                                <PaperButton
                                    onPress={requestLocationPermission}
                                    mode="contained"
                                    style={{ marginRight: 10, backgroundColor: '#3498db', color: 'white' }}
                                    disabled={attendance[0]?.Start_Date ? true : false}>
                                    Start Day
                                </PaperButton>
                            </Card.Actions>
                        </Card>
                    </View>
                }

                <View style={{ padding: 10, paddingBottom: 0 }}>
                    <Card style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
                        <Card.Title
                            title={'SMT Apps'}
                            titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
                            subtitleStyle={{ width: '70%' }} />
                        <Card.Content>
                            <View style={styles.roundedView}>
                                <TouchableOpacity
                                    style={styles.IconView}
                                    onPress={() => {
                                        navigation.navigate('WebView', { url: `https://erpsmt.in/?InTime=${loginInfo.InTime}&UserId=${loginInfo.UserId}&username=${uName}&branch=${branch}&uTypeId=${uType}&uTypeGet=${uRole}&userToken=${token}&SessionId=${SessionId}` })
                                    }}>
                                    {/* <Icon
                                        source="finance"
                                        color={MD3Colors.error50}
                                        size={30}
                                    /> */}
                                    <Image
                                        source={require('../assets/erp.png')}
                                        style={{ width: 45, height: 35 }} />
                                    <Text>ERP APP</Text>
                                </TouchableOpacity>
                                {taskApp &&
                                    <TouchableOpacity
                                        style={styles.IconView}
                                        onPress={() => {
                                            navigation.navigate('WebView', { url: `https://smttask.in/?InTime=${loginInfo.InTime}&UserId=${loginInfo.UserId}&username=${uName}&branch=${branch}&uType=${uType}` })
                                        }}>
                                        {/* <Icon
                                            source="calendar-check"
                                            color={MD3Colors.error50}
                                            size={26}
                                        /> */}
                                        <Image
                                            source={require('../assets/clock.png')}
                                            style={{ width: 35, height: 40 }} />
                                        <Text>TASK APP</Text>
                                    </TouchableOpacity>
                                }
                            </View>
                        </Card.Content>
                    </Card>
                </View>



            </LinearGradient>
            <Dialog visible={dialog} onDismiss={dialogClose}>
                <Dialog.Title>Close Attendance</Dialog.Title>
                <Dialog.Content>
                    <Text style={{ marginBottom: 5 }}>Day Summary</Text>
                    <TexInpt
                        multiline={true}
                        numberOfLines={5}
                        mode='outlined'
                        onChangeText={(e) => setSummary(e)} />
                </Dialog.Content>
                <Dialog.Actions>
                    <PaperButton mode='elevated' onPress={EndDay} buttonColor='lightgreen'>Submit</PaperButton>
                    <PaperButton mode='elevated' onPress={dialogClose}>Cancel</PaperButton>
                </Dialog.Actions>
            </Dialog>
        </SafeAreaView>
    )
}

export default HomeComponent;