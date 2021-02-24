
var addr = localStorage.getItem("ip");
var serialN = localStorage.getItem("serialNumber");
var ws = new WebSocket('ws://'+ addr +':4400');
var actuar1 = 0;
//alert('Config WebSocket ip = ' + addr);

ws.onmessage = function (event) {
  var infoEquipo = event.data;
  alert('a message =' + infoEquipo);
  if (infoEquipo == serialN )
  {
    processData();
  }
};

ws.onopen = function () {
  ws.send('I just connected!' + serialN );
};

function processData(){
  alert('Dentro process Data');
  const options = {
      method: 'get',
      data: { },
      headers: {}
  };   
  cordova.plugin.http.sendRequest('http://' + addr + ':3000/api/v1/equipo/' + serialN , options, function(response) {
   
    var infoEquipo = JSON.parse(response.data)
    
    infoEquipo.forEach(info=> {    
      actuar1 = info.accion1;
    });
    
    alert("actuar1= " + actuar1);

    if (actuar == 0 ){ if (open) serial.write('0'); } 
    if (actuar == 1 ){ if (open) serial.write('1'); } 

    }, function(response) {       
        if( response.error) {
          alert("Error Busca Datos Base de datos " + response.error);      
        } 
      }
    ); // Fin GET Request
}
