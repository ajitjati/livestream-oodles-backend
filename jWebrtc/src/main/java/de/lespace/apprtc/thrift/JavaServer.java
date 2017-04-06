package de.lespace.apprtc.thrift;

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import org.apache.thrift.server.TServer;
import org.apache.thrift.server.TThreadPoolServer;
import org.apache.thrift.transport.TServerSocket;
import org.apache.thrift.transport.TServerTransport;



public class JavaServer {

    public JavaServer(){
        
    }


  public static void main(String [] args) {
      new JavaServer().start();
  }
  public void start(){
    try {


      Runnable simple = new Runnable() {
        public void run() {
          //simple(processor1);
            simple(new Webrtc.Processor(new WebrtcImpl()));
        }
      };     
      /*
      Runnable secure = new Runnable() {
        public void run() {
          secure(processor);
        }
      };*/

      new Thread(simple).start();
     // new Thread(secure).start();
    } catch (Exception x) {
      x.printStackTrace();
    }
  }

  public static void simple(Webrtc.Processor processor) {
    try {
      TServerTransport serverTransport = new TServerSocket(9090);
     // TServer server = new TSimpleServer(new Args(serverTransport).processor(processor));

      // Use this for a multithreaded server
      TServer server = new TThreadPoolServer(new TThreadPoolServer.Args(serverTransport).processor(processor));

      System.out.println("Starting the TThreadPoolServer server...");
      server.serve();
      System.out.println("TThreadPoolServer Server started");
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

 /* public static void secure(Calculator.Processor processor) {
    try {

      TSSLTransportParameters params = new TSSLTransportParameters();
      // The Keystore contains the private key
      params.setKeyStore("../../lib/java/test/.keystore", "thrift", null, null);

      TServerTransport serverTransport = TSSLTransportFactory.getServerSocket(9091, 0, null, params);
      TServer server = new TSimpleServer(new Args(serverTransport).processor(processor));

      // Use this for a multi threaded server
      // TServer server = new TThreadPoolServer(new TThreadPoolServer.Args(serverTransport).processor(processor));

      System.out.println("Starting the secure server...");
      server.serve();
    } catch (Exception e) {
      e.printStackTrace();
    }
  }*/
}
