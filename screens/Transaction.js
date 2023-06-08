import {Camera,Permissions} from "expo-camera";
import React, {Component, useEffect} from "react";
import {View,Text,StyleSheet, TouchableOpacity,TextInput,
    ImageBackground, Alert, KeyboardAvoidingView} from "react-native";
import {BarCodeScanner} from "expo-barcode-scanner";
import db from "../config";
import { collection,addDoc, getDocs, doc, query,where,
     updateDoc, serverTimestamp,increment, limit } 
     from "firebase/firestore";



const bgImage = require("../assets/background2.png");

export default class TransactionScreen extends Component{
    constructor(props){
        super(props);
        this.state = {
            bookId:"",
            bookName:"",
            studentId:"",
            studentName:"",
            type: Camera.Constants.Type.back,
            domState:"normal",
            hasCameraPermissions: null,
            scanned: false,
            scannedData:""
        };
    }

    getCameraPermissions = async domState =>{
        const {status} = await Camera.getCameraPermissionsAsync();
        this.setState({
            /* status === granted retorna verdadeiro, se usuário 
            deu permissão para usar a câmera ou falso
             se não permitiu */

            hasCameraPermissions: status === "granted",
            domState: domState,
            scanned: false
        });
    };

    handleBarCodeScanned = async ({type,data})=>{
        const {domState} = this.state;

        if(domState === "bookId"){
            this.setState({
                bookId:data,
                domState:"normal",
                scanned:true
            });
        } else if(domState === "studentId"){
            this.setState({
                studentId:data,
                domState:"normal",
                scanned:true
            });
        }
    };

    handleTransaction = async ()=>{
        var {bookId,studentId} = this.state;
        await this.getBookDetails(bookId);
        await this.getStudentDetails(studentId);

        var transactionType = await this.checkBookAvailability(bookId);

        if(!transactionType){
            this.setState({
                bookId:"",
                studentId:""
            });
            Alert.alert("O livro não existe no banco de dados da biblioteca");
        }else if(transactionType === "issue"){
            var isEligible = await this.checkStudentEligibilityForBookIssue(studentId);
            if(isEligible){
                var {bookName,studentName} = this.state;
                this.initiateBookIssue(bookId,studentId,bookName,studentName);
                Alert.alert("Livro entregue ao aluno!");
            }
        }else if(transactionType === "return"){
            var isEligible = await this.checkStudentEligibilityForBookReturn(bookId,studentId);
            
            if(isEligible){
                var {bookName,studentName} = this.state;
                this.initiateBookReturn(bookId,studentId,bookName,studentName);
                Alert.alert("Livro devolvido à biblioteca!");
            }
        }
    };


    getBookDetails =  async(bookId)=>{
        
        const q = query(collection(db,"books"),where("book_id","==",bookId.trim()))
        //const querySnapshot = await getDocs(collection(db, "books")); -- Pega a coleção toda
        const querySnapshot = await(getDocs(q));
        if(!querySnapshot.empty){
            querySnapshot.forEach((doc) => {
                this.setState({
                    bookName: doc.data().book_name
                });
                console.log(`${doc.id} => ${doc.data().book_name}`);
            });
        }else{
            Alert.alert("Livro não encontrado!");
        }
    };

    getStudentDetails = async(studentId) =>{
        const q = query(collection(db,"students"),where("student_id","==",studentId.trim()))
        
        const querySnapshot = await(getDocs(q));
        if(!querySnapshot.empty){
            querySnapshot.forEach((doc) => {
                this.setState({
                    studentName: doc.data().student_name
                });
                console.log(`${doc.id} => ${doc.data().student_name}`);
            });
        }else{
            Alert.alert("Aluno não encontrado!");
        }
    };

    initiateBookIssue = async(bookId,studentId,bookName,studentName)=>{
       //adicionar transação
       try {
            const docRef = await addDoc(collection(db, "transactions"), {
            student_id:studentId.trim(),
            student_name:studentName,
            book_id:bookId.trim(),
            book_name:bookName,
            date:serverTimestamp(),
            transaction_type:"issue"
            });
            console.log("Documento Salvo com ID: ", docRef.id);
        } 
        catch (e) {
            console.error("Ocorreu um erro ao adicionar o documento: ", e);
        }


       //alterar status do livro
       
        const bookRef = doc(db, "books",bookId.trim());
        await updateDoc(bookRef,{
            is_book_available:false
        });
          

       //alterar o número de livros retirados pelo aluno
       
       const studentsRef = doc(db, "students",studentId.trim());
       
       await updateDoc(studentsRef,{
        number_of_books_issued:increment(1)
       });

       //atualizando estado local
       this.setState({
        bookId:"",
        studentId:""
       });
    };

    initiateBookReturn = async (bookId, studentId, bookName, studentName)=>{
        //adicionar transação
       try {
        const docRef = await addDoc(collection(db, "transactions"), {
        student_id:studentId,
        student_name:studentName,
        book_id:bookId,
        book_name:bookName,
        date:serverTimestamp(),
        transaction_type:"return"
        });
        console.log("Documento Salvo com ID: ", docRef.id);
    } 
    catch (e) {
        console.error("Ocorreu um erro ao adicionar o documento: ", e);
    }

         //alterar status do livro
       
         const bookRef = doc(db, "books",bookId.trim());
         await updateDoc(bookRef,{
             is_book_available:true
         });


         //alterar o número de livros retirados pelo aluno
       
       const studentsRef = doc(db, "students",studentId.trim());
       
       await updateDoc(studentsRef,{
        number_of_books_issued:increment(-1)
       });


       //atualizando estado local
       this.setState({
        bookId:"",
        studentId:""
       });

    };
    checkBookAvailability = async(bookId) =>{
        const q = query(collection(db,"books"),where("book_id","==",bookId.trim()))
        
        const querySnapshot = await(getDocs(q));
        var transactionType = "";
        if(!querySnapshot.empty){
            querySnapshot.forEach((doc) => {
                //se o livro estiver disponível, o tipo de transação
                //será issue (emprestar), senão será return(devolver)
                transactionType = doc.data().is_book_available?"issue":"return";
                
    
            });
        }else{
            transactionType = false;
            Alert.alert("Livro não encontrado!");
        }
        return transactionType;
    };

    checkStudentEligibilityForBookIssue = async(studentId) =>{
        const q = query(collection(db,"students"),where("student_id","==",studentId.trim()))
        
        const querySnapshot = await(getDocs(q));

        var isStudentEligible = "";

        if(querySnapshot.empty){
            this.setState({
                bookId:"",
                studentId:""
            });
            isStudentEligible = false;
            Alert.alert("O ID do aluno não foi encontrado!");

        }else{
            querySnapshot.forEach((doc) => {
                //se o livro estiver disponível, o tipo de transação
                //será issue (emprestar), senão será return(devolver)
                if(doc.data().number_of_books_issued < 2){
                    isStudentEligible = true;
                }else{
                    isStudentEligible = false;
                    Alert.alert("O aluno já retirou 2 livros!");
                    this.setState({
                        bookId:"",
                        studentId:""
                    });
                }
                
    
            });
        }
        return isStudentEligible;

    };

    checkStudentEligibilityForBookReturn = async(bookId,studentId) =>{
        const q = query(collection(db,"transactions"),where("book_id","==",bookId.trim()),where("student_id","==",studentId.trim()),limit(1));
        
        const querySnapshot = await(getDocs(q));

        var isStudentEligible = "";

        if(querySnapshot.empty){
            this.setState({
                bookId:"",
                studentId:""
            });
            isStudentEligible = false;
            Alert.alert("Não foi encontrado o registro da transação");

        }else{
            querySnapshot.forEach((doc) => {
                //se o livro estiver disponível, o tipo de transação
                //será issue (emprestar), senão será return(devolver)
                var lastBookTransaction = doc.data();
                console.log(doc.data());
                if(lastBookTransaction.student_id === studentId.trim()){
                    isStudentEligible = true;
                }else{
                    isStudentEligible = false;
                    Alert.alert("O livro não foi retirado por esse aluno!");
                    this.setState({
                        bookId:"",
                        studentId:""
                    });
                }
                
    
            });
        }
        return isStudentEligible;

    };
    render(){
        const {domState, hasCameraPermissions, scannedData, scanned, bookId, studentId} = this.state;
        if(domState !== "normal"){
            return(
                <BarCodeScanner
                onBarCodeScanned={scanned?undefined:this.handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
                />
            );
        }
        
        return(
            <KeyboardAvoidingView behavior="padding" style={styles.container}>
                <ImageBackground source={bgImage} style={styles.bgImage}>
                <View style={styles.lowerContainer}>
                    <View style={styles.textInputContainer}>
                        <TextInput
                        style={styles.textInput}
                        placeholder={"ID do Livro"}
                        placeholderTextColor={"#FFFFFF"}
                        value={bookId}
                        onChangeText={text=>this.setState({bookId:text})}
                        />
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress = {()=>this.getCameraPermissions("bookId")}
                        >
                            <Text style={styles.scanButtonText}>Digitalizar</Text>
                        </TouchableOpacity> 
                    </View>
                    <View style={[styles.textInputContainer, {marginTop: 25}]}>
                        <TextInput
                            style={styles.textInput}
                            placeholder={"ID do Aluno"}
                            placeholderTextColor={"#FFFFFF"}
                            value={studentId} 
                            onChangeText={text=>this.setState({studentId:text})}
                        />
                        <TouchableOpacity
                            style={styles.scanButton}
                            onPress={()=>this.getCameraPermissions("studentId")}
                        >
                            <Text style={styles.scanButtonText}>
                                Digitalizar
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={[styles.button,{marginTop:25}]}
                        onPress={this.handleTransaction}>
                            <Text style={styles.buttonText}>Enviar</Text>
                    </TouchableOpacity>
                </View>
                
                </ImageBackground>
            </KeyboardAvoidingView>
            
        );
    }
}

const styles = StyleSheet.create({
    container:{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#5653D4"
    },
    text: {
        color: "#fff",
        fontSize: 30
    },
    lowerContainer:{
        flex:0.5,
        alignItems:"center"
    },
    textInputContainer:{
        borderWidth: 2,
        borderRadius:10,
        flexDirection:"row",
        backgroundColor:"#9DFD24",
        borderColor:"#FFFFFF"
    },
    textInput:{
        width:"55%",
        height:50,
        padding: 10,
        borderColor:"#FFFFFF",
        borderRadius: 10,
        borderWidth: 3,
        fontSize: 18,
        backgroundColor:"#5653D4",
        color:"#FFFFFF"
    },
    scanButton:{
        width: 100,
        height: 50,
        backgroundColor: "#9DFD24",
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "center",
        alignItems: "center"
    },
    scanButtonText:{
        fontSize: 22,
        color: "#0A0101"
    },
    bgImage:{
        flex:1,
        resizeMode: "cover",
        justifyContent: "center"
    },
    button:{
        width:"40%",
        height:55,
        justifyContent:"center",
        alignItems:"center",
        backgroundColor:"#F48D20",
        borderRadius:15
    },
    buttonText:{
        fontSize:24,
        color:"#FFFFFF"
    }
});