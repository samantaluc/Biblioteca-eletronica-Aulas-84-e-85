import React, {Component} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "react-native-vector-icons/Ionicons";

import TransactionScreen from "../screens/Transaction";
import SearchScreen from "../screens/Search";

const Tab = createBottomTabNavigator();

export default class BottomTabNavigator extends Component{
    render(){
        return(
           
                <Tab.Navigator
                screenOptions={({route})=>({
                    tabBarActiveTintColor:'#0C07BB',
                    tabBarInactiveTintColor: "#9C9C9C",
                    tabBarStyle:[
                        {
                            height: 75,
                            margin:5,
                            alignItems: "center",
                            justifyContent: "center"
                        }
                    ],
                    tabBarLabelStyle:[{
                        fontSize:20
                    }],
                    tabBarIcon:({color,size}) =>{
                        const iconName = {
                            Transação:'book',
                            Pesquisa:'search'
                        };
                       
                        return (
                            <MaterialCommunityIcons
                            name={iconName[route.name]}
                            size={size}
                            color={color}
                            />
                        );
                        }
                        
                    })
                }
                >
                    <Tab.Screen name="Transação" component={TransactionScreen} />
                    <Tab.Screen name="Pesquisa" component={SearchScreen} />
                </Tab.Navigator>
            
        );
    }
}