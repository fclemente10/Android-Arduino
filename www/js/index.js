var app = {
    
    initialize: function() {
        
        document.addEventListener('deviceready', this.onDeviceReady, false);
             
    },
    onDeviceReady: function() {
        var potText = document.getElementById('pot');
        var delta = document.getElementById('delta');
        var on = document.getElementById('on'); // Botón ON
        var off = document.getElementById('off'); // Botón OFF
        var get = document.getElementById('get'); // Botón Prueba DB
       // var weso = document.getElementById('weso');
        var open = false;
        var addr = localStorage.getItem("ip");
        var serialN = localStorage.getItem("serialNumber");
        var nombre = localStorage.getItem("nombre");
        var str = '';
        var ctrlOnOff = 0;
        var lastRead = new Date();
        var msg = document.getElementById('msg');
        let valorMedioCorriente = [];
        var enviaCorriente = 0;
        
        //Verifica comunicacion con Arduino
        var errorCallback = function(message) {
            alert('Error: ' + message);
            //alert('IP = ' + addr);
        };

        // Verifica Conexion con la base de datos...
        const options = { method: 'get', data: { }, headers: {} };   
        cordova.plugin.http.sendRequest('http://' + addr + ':3000/api/v1/equipo', options, function(response) {
            this.msg.innerText = response.data;                      // informa status del equipo
        }, function(response) {
            if (response.error){                                // error GET, buscar nueva ip con usuario                                      
                function onPrompt(results) {                    // Crea Alarta para usuario anadir IP
                    alert("IP= " + results.input1);
                    addr = results.input1;
                    localStorage.setItem("ip", results.input1); // Guarda valor de IP en las configuraciones
                }                   
                navigator.notification.prompt(
                    'Anadir la IP Correcta',  // message
                    onPrompt,                  // callback to invoke
                    'Registration',            // title
                    ['Ok','Exit'],             // buttonLabels
                    '192.168.1.100'                 // defaultText
                );
            }
        });
        // Configuracion de Nombre de equipo y numero Serial
         if (serialN != device.uuid){
            // Busca nombre del Equipo con usuario
            function onPrompt(results) {                    // Crea Alarta para usuario anadir nombre
                alert("Nombre= " + results.input1);
                localStorage.setItem("nombre", results.input1); // Guarda valor de Nombre en las configuraciones
                nombre = results.input1;
                if (results.buttonIndex == 1)
                {
                    alert("Numero serial= " + device.uuid);
                    localStorage.setItem("serialNumber", device.uuid); // Guarda Numero Serial en configuraciones
                    serialN = device.uuid;        
                    this.msg.innerText = "Grabando nuevo equipo en la Base de datos";

                    cordova.plugin.http.setDataSerializer('json');
                    const options2 = {
                        method: 'post',
                        data: {"nombre": nombre,
                        "serialNumber": serialN,
                        "variable1": "0",
                        "variable2": "0",
                        "accion1": 0,
                        "accion2": 0 },
                        headers: {}
                    };   
                    cordova.plugin.http.sendRequest('http://' + addr + ':3000/api/v1/equipo', options2, function(response) { 
                        this.msg.innerText = response.status; //debug
                    },function(response) {
                        console.log(response.status);
                        this.msg.innerText = response.status;
                        this.msg.innerText = response.status;
                    });
                }           
            }                   
            navigator.notification.prompt(
                'Anadir un nombre para Dispositivo',  // message
                onPrompt,                  // callback to invoke
                'Registration',            // title
                ['Ok','Exit'],             // buttonLabels
                'Android Sala'                 // defaultText
            );
        }

        // Envia datos al servidor a cada minuto
        setInterval(function () {            
            let elementos = valorMedioCorriente.length;
            enviaCorriente = valorMedioCorriente.reduce((ant, actual) => ant + actual) / elementos;
            this.msg.innerText =("Valor medio corriente medido = " + enviaCorriente);
            valorMedioCorriente = []; // zera valores
        }, 30000); // Un minuto = 60000 -> para pruebas 30000    

        // request permission first
        serial.requestPermission(
            // if user grants permission
            function(successMessage) {
                // open serial port
                serial.open(
                    {baudRate: 9600},
                    // if port is succesfuly opened
                    function(successMessage) {
                        open = true;
                        // register the read callback
                        serial.registerReadCallback(
                            function success(data){
                                // decode the received message
                                var view = new Uint8Array(data);
                                if(view.length >= 1) {
                                    for(var i=0; i < view.length; i++) {
                                        // if we received a \n, the message is complete, display it
                                        if(view[i] == 13) {
                                            // compruebe si la velocidad de lectura corresponde a la velocidad de "serial print" de arduino
                                            var now = new Date();
                                            delta.innerText = now - lastRead;
                                            lastRead = now;
                                            // display the message
                                            var value = parseInt(str);

                                            if(isNaN(value)){ value = 1; } 
                                            
                                            pot.innerText = value;
 //                                           this.msg.innerText = 'Valor Pot=' + value;
                                            str = '';
                                            valorMedioCorriente.push(value);                                          
                                        }
                                        // if not, concatenate with the begening of the message
                                        else {
                                            var temp_str = String.fromCharCode(view[i]);
                                            var str_esc = escape(temp_str);
                                            str += unescape(str_esc);
                                        }
                                    }
                                }
                            },
                            // error attaching the callback
                            errorCallback
                        );
                    },
                    // error opening the port
                    errorCallback
                );
            },
            // user does not grant permission
            errorCallback
        );
        
        // Click para enchufar equipo manualmente
        on.onclick = function() {
            if (open) serial.write('1');
            ctrlOnOff = 1;
            gravaDados(); // Graba en la base de datos click manual
        };
        // Click para apagar equipo manualmente
        off.onclick = function() {
            if (open) serial.write('0');
            ctrlOnOff = 0;
            gravaDados(); // Graba en la base de datos click manual
        };
        // Verificar status del equipo
        get.onclick = function() {
            getDados();
        }

        function getDados() 
        {
            this.msg.innerText = "GET datos v0.5";
            const options2 = {
                method: 'get',
                data: { },
                headers: {}
            };   
            cordova.plugin.http.sendRequest('http://' + addr + ':3000/api/v1/equipo/'+serialN, options2, function(response) {
                this.msg.innerText = response.data; //debug
                }, function(response) {
                this.msg.innerText = response.status; //debug
                this.msg.innerText = response.error; //debug
            });
        }
        
         /********* Actualiza base de datos con status del equipo ********/
        function gravaDados() 
        {               
 //           this.msg.innerText = "POST datos v0.5";
            cordova.plugin.http.setDataSerializer('json');
            const options3 = {
                method: 'put',
                data: {
                "serialNumber": serialN,
                "variable1": enviaCorriente,
                "variable2": "220",
                "accion1": ctrlOnOff,
                "accion2": 0 },
                headers: {}
            };   
            cordova.plugin.http.sendRequest('http://' + addr + ':3000/api/v1/equipo', options3, function(response) {
                this.msg.innerText = response.data; //debug
                }, function(response) {
                this.msg.innerText = response.status; //debug
                this.msg.innerText = response.error; //debug
            });
        }
    }  
};

app.initialize();


