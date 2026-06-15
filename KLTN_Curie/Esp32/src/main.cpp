#include <Arduino.h>
#include <WiFi.h>
const char *ssid = "QUANG UY";
const char *password = "aaaa2222";
IPAddress loccal_IP(192, 168, 1, 111);
IPAddress gateway(192,168,1,1);
IPAddress subnet(255,255,0,0);
IPAddress primaryDNS(8,8,8,8);
IPAddress sacondaryDNS(8,8,4,4);
void setup(){
 Serial.begin(115200);
 if (!WiFi.config(loccal_IP,gateway,subnet,primaryDNS,sacondaryDNS)){
  Serial.println("Thiet lap fail");
 }
 Serial.println("Đang kết nối với Wifi: "+ String(ssid));
 WiFi.begin(ssid,password);
 while (WiFi.status() != WL_CONNECTED){
  Serial.println(".");
  delay(500);
 }
 Serial.print("Da ket noi voi Wifi: "+ String(ssid) + " voi IP: ");
 Serial.println(WiFi.localIP());
}
void loop(){

}