/*Developer: Frederik Hauke

Important Notices:

This Arduino-Code is written for Visualizating measurement data from a microcontroller via Bluetooth.

Before starting this application, the Bluetooth-Modul (HC-05) has to be coupled to the Smartphone.In the special case of the HC-05 the default PinCode for initiating the Coupling-Process is "1234".

Wiring: GND of HC-05 to GND Arduino, VCC of HC-05 to VCC Arduino, TX HC-05 to Arduino Pin 10 (RX) RX HC-05 to Arduino Pin 11 (TX) */

#include <SoftwareSerial.h>
#include <Servo.h>

Servo myservo;
SoftwareSerial BTserial(10, 11); // RX | TX

char data[500];
char xdr[500];

char vn[6];
char totp[6];
char txEnterId[64];
char txExitId[64];

String sharedKey="";
String accId="";
String txId="";
String fee="";

int xdrSize = 0;
int dataSize=0;

void setup() {

myservo.attach(4); 
BTserial.begin(9600); 

}

void loop() {

while(BTserial.available()==0)
  {}

if(BTserial.available() > 0){
    char character = BTserial.read();
    // xdr
    if(character == '@'){
      strcpy(xdr,data);
      BTserial.print(xdr);
      BTserial.print(";");
      memset(data, 0, sizeof data);
      dataSize=0;
    }
    // get vn
    else if(character == '%'){
      strcpy(vn,data);
      BTserial.print("vehicle number is ");
      BTserial.print(vn);
      BTserial.print(";");
      memset(data, 0, sizeof data);
      dataSize=0;
    }
    // get totp
    else if(character == '*'){
      strcpy(totp,data);
      BTserial.print("totp is ");
      BTserial.print(totp);
      BTserial.print(";");
      memset(data, 0, sizeof data);
      dataSize=0;
    }
    // api
    else if(character == '#'){
       BTserial.print(data);
       BTserial.print(";");
       if(vn=="") {
          BTserial.print("Not have vehicle number yet.");
          BTserial.print(";");
       } else {
          if (strcmp(data,"key") == 0){
            BTserial.print("Call key/:vn API ");
            BTserial.print(";");
            // send :vn
            // recieve {sharedKey}
          }
          if (strcmp(data,"auth") == 0){
            if (totp!="") {
              BTserial.print("Call auth/:vn API ");
              BTserial.print(";");
              // send :vn, {totp}
              // recieve {status, accId}
            }
          }
          if (strcmp(data,"entry") == 0){
            BTserial.print("Call xdr/entry/:vn API ");
            BTserial.print(";");
              // gather()
              // send :vn,{xdr}
              // recieve {status, txId}
            myservo.write(105);
            delay(2000);
            myservo.write(5);
          }  
          if (strcmp(data,"exit") == 0){
            BTserial.print("Call xdr/exit/:vn API ");
            BTserial.print(";");
              // gather()
              // send :vn, {xdr, txEnterId}
              // recieve {status, txId}
            myservo.write(105);
            delay(2000);
            myservo.write(5);
          }   
          if (strcmp(data,"pay") == 0){
            BTserial.print("Call xdr/pay/:vn API ");
            BTserial.print(";");
              // gather()
              // send :vn, {xdr}
              // recieve {status, txId}
          }
          if (strcmp(data,"fee") == 0){
            BTserial.print("Call fee/:vn API ");
            BTserial.print(";");
              // send :vn, {txEnterId,txExitId}
              // recieve {fee}
          }  
       }
      memset(data, 0, sizeof data);
      dataSize=0;
     } else if(character =='~') {
       BTserial.print("Clear");
       BTserial.print(";");
       
       sharedKey="";
       accId="";
       txId="";
       fee="";
       
       memset(txEnterId, 0, sizeof txEnterId);
       memset(txExitId, 0, sizeof txExitId);
       memset(vn, 0, sizeof vn);
       memset(totp, 0, sizeof totp);
       memset(xdr, 0, sizeof xdr);
       memset(data, 0, sizeof data);
       xdrSize=0;
       dataSize=0;
       
     } else {
       data[dataSize] = character;
       dataSize++;
     }
}
}
