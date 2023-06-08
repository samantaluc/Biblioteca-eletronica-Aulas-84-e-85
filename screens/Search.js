import React, { Component } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, KeyboardAvoidingView } from "react-native";
import db from "../config";
import { ListItem, Icon } from "react-native-elements";
import { collection, getDocs, query, where, limit, startAfter, orderBy } from "firebase/firestore";


export default class SearchScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            allTransactions: [],
            searchText: "",
            lastVisibleTransaction: null
        };
    }
    componentDidMount = async () => {
        await this.getTransactions();


    }
    getTransactions = async () => {

        const q = query(collection(db, "transactions"), limit(10));


        const querySnapshot = await getDocs(q); //-- Pega a coleção toda
        const { allTransactions, lastVisibleTransaction } = this.state;
        if (!querySnapshot.empty) {

            let documento = [];
            let last = null;
            querySnapshot.docs.map((doc) => {
                documento.push({ id: doc.id, data: doc.data() });

            });
            last = documento[documento.length - 1].id;

            this.setState({
                allTransactions: documento,
                lastVisibleTransaction: last
            });

        }
    }

    renderItem = ({ item }) => {
        let info = item;
        var date = info.data.date.toDate().toString().split(" ").splice(0, 4).join(" ");

        var transactionType = info.data.transaction_type === "issue" ? "Emprestado para" : "Devolvido por";

        return (
            <View style={{ borderWidth: 1 }}>

                <ListItem key={info.id} bottomDivider>
                    <Icon type={"antdesign"} name={"book"} size={40} />
                    <ListItem.Content>
                        <ListItem.Title style={styles.title}>
                            {`${info.data.book_name} (${info.data.book_id})`}
                        </ListItem.Title>

                        <ListItem.Subtitle style={styles.subtitle}>
                            {`Este livro foi ${transactionType}  ${info.data.student_name}`}
                        </ListItem.Subtitle>
                        <View style={styles.lowerLeftContainer}>
                            <View style={styles.transactionContainer}>
                                <Text style={[styles.transactionText, { color: info.data.transaction_type === "issue" ? "#78D304" : "#0364F4" }]}>
                                    {info.data.transaction_type.toUpperCase()}
                                </Text>
                                <Icon type={"ionicon"} name={info.data.transaction_type === "issue" ? "checkmark-circle-outline" : "arrow-redo-circle-outline"} color={info.data.transaction_type === "issue" ? "#78D304" : "#0364F4"} />
                            </View>
                            <Text style={styles.date}>
                                {date}
                            </Text>
                        </View>
                    </ListItem.Content>
                </ListItem>
            </View>
        );
    };

    handleSearch = async (text) => {
        var enteredText = text.toUpperCase().split("");
        text = text.toUpperCase();
        this.setState({
            allTransactions: []
        });
        if (text) {
            if (enteredText[0] === "B") {

                const q = query(collection(db, "transactions"), where("book_id", "==", text.trim()), limit(10));
                const querySnapshot = await (getDocs(q));
                if (!querySnapshot.empty) {
                    let documento = [];
                    let last = null;
                    querySnapshot.docs.map(doc => {
                        documento.push({ id: doc.id, data: doc.data() });

                    });
                    last = documento[documento.length - 1].id;
                    this.setState({
                        allTransactions: documento,
                        lastVisibleTransaction: last,

                    });

                } else {
                    Alert.alert("Livro não encontrado!");
                    await this.getTransactions();
                }
            } else if (enteredText[0] === "S") {
                const q = query(collection(db, "transactions"), where("student_id", "==", text.trim()), limit(10));
                const querySnapshot = await (getDocs(q));
                if (!querySnapshot.empty) {
                    let documento = [];
                    let last = null;
                    querySnapshot.docs.map(doc => {
                        documento.push({ id: doc.id, data: doc.data() });

                    });
                    last = documento[documento.length - 1].id;
                    this.setState({
                        allTransactions: documento,
                        lastVisibleTransaction: last,

                    });
                } else {
                    Alert.alert("Aluno não encontrado!");
                    await this.getTransactions();
                }
            } else {
                Alert.alert("Código inválido!");
                await this.getTransactions();
            }

        } else { this.getTransactions(); }
    }

    fetchMoreTransactions = async (text) => {
        var enteredText = text.toUpperCase().split("");
        text = text.toUpperCase();


        const { lastVisibleTransaction, allTransactions } = this.state;

        if (enteredText[0] === "B") {

            const q = query(collection(db, "transactions"), where("book_id", "==", text.trim()), orderBy("date"), startAfter(lastVisibleTransaction), limit(10));
            const querySnapshot = await (getDocs(q));
            if (!querySnapshot.empty) {
                let documento = allTransactions;
                let last = lastVisibleTransaction;
                querySnapshot.docs.map(doc => {
                    documento.push({ id: doc.id, data: doc.data() });

                });
                last = documento[documento.length - 1].id;
                this.setState({
                    allTransactions: documento,
                    lastVisibleTransaction: last
                });

            }
        } else if (enteredText[0] === "S") {
            const q = query(collection(db, "transactions"), where("student_id", "==", text.trim()), orderBy("date"), startAfter(lastVisibleTransaction), limit(10));
            const querySnapshot = await (getDocs(q));
            if (!querySnapshot.empty) {
                let documento = allTransactions;
                let last = lastVisibleTransaction;
                querySnapshot.docs.map(doc => {
                    documento.push({ id: doc.id, data: doc.data() });

                });
                last = documento[documento.length - 1].id;
                this.setState({
                    allTransactions: documento,
                    lastVisibleTransaction: last
                });
            }
        }
    }

    render() {
        const { searchText, allTransactions } = this.state;


        return (<KeyboardAvoidingView behavior="padding" style={styles.container}>

            <View style={styles.container}>

                <View style={styles.upperContainer}>

                    <View style={styles.textInputContainer}>
                        <TextInput style={styles.textInput}
                            placeholder={"ID do aluno ou do Livro"}
                            placeholderTextColor={"#FFFFFF"}
                            value={searchText}
                            onChangeText={text => this.setState({ searchText: text })}
                        />
                        <TouchableOpacity style={styles.scanButton}
                            onPress={() => this.handleSearch(searchText)} >
                            <Text style={styles.scanButtonText}>
                                Pesquisar
                            </Text>
                        </TouchableOpacity>

                    </View>

                </View>

                <View style={styles.lowerContainer}>
                    {Object.keys(this.state.allTransactions).length > 0 ?
                        <FlatList
                            data={allTransactions}
                            renderItem={this.renderItem}
                            keyExtractor={(item, index) => index.toString()}
                            onEndReachedThreshold={0.7}
                            onEndReached={() => this.fetchMoreTransactions(searchText)}

                        /> : <Text>Carregando...</Text>}
                </View>

            </View>
        </KeyboardAvoidingView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4"
    },
    upperContainer: {
        flex: 0.2,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 20
    },
    textInputContainer: {
        borderWidth: 2,
        borderRadius: 10,
        flexDirection: "row",
        backgroundColor: "#9DFD24",
        borderColor: "#FFFFFF"
    },
    textInput: {
        width: "57%",
        height: 50,
        padding: 10,
        borderColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 3,
        fontSize: 18,
        backgroundColor: "#5653D4",
        color: "#FFFFFF"
    },
    scanButton: {
        width: 100,
        height: 50,
        backgroundColor: "#9DFD24",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },
    scanButtonText: {
        fontSize: 20,
        color: "#0A0101",
    },
    lowerContainer: {
        flex: 0.8,
        backgroundColor: "#FFFFFF",
        width: 300,
        marginTop: 10
    },
    title: {
        fontSize: 20
    },
    subtitle: {
        fontSize: 16,
        height: 150
    },
    lowerLeftContainer: {
        alignSelf: "flex-start",
        marginTop: -90,

    },
    transactionContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center"
    },
    transactionText: {
        fontSize: 20,

    },
    date: {
        fontSize: 12,
        paddingTop: 5
    }
});