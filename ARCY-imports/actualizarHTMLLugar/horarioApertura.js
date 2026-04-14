export const actualizarHorarioApertura = (placeInfo) => {
  if(placeInfo.opening_hours != null){
    const periods = placeInfo.opening_hours.periods;
    const today = new Date();
    const day = today.getDay();
    let dayWeekday = "";
    let mañana = "";
  
    if (day === 0) {
       dayWeekday = 6;
    } else {
      dayWeekday = day - 1;
    }
  
    if(day === 6){
      mañana = 0;
    }else{
      mañana = day + 1;
    }
  
    let isOpen = {
      openingTime: "",
      closingTime: "",
      openingTimeMañana: "",
    };
  
    if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Cerrado"){
      document.getElementById("horario-text").innerHTML = '<a style= "color: red">"Día de descanso"</a>';
      document.getElementById("horario-day").style.color = "red";
      document.getElementById("horario-day").innerHTML = '<a style= "color: red">"Día de descanso"</a>';
      document.getElementById("horario-text").style.color = "red";
    }
    else if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Abierto 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Abierto 24 horas"){
      document.getElementById("horario-text").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
      document.getElementById("horario-day").style.color = "green";
      document.getElementById("horario-day").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
      document.getElementById("horario-text").style.color = "green";
    }
    else if(placeInfo.opening_hours.weekday_text[dayWeekday] == "lunes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "martes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "miércoles: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "jueves: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "viernes: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "sábado: Abierto las 24 horas" || placeInfo.opening_hours.weekday_text[dayWeekday] == "domingo: Abierto las 24 horas"){
      document.getElementById("horario-text").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
      document.getElementById("horario-day").style.color = "green";
      document.getElementById("horario-day").innerHTML = '<a style= "color: green">Servicio ininterrumpido</a>';
      document.getElementById("horario-text").style.color = "green";
    }
    else if(placeInfo.opening_hours.periods[day] === null){
      document.getElementById("horario-text").innerHTML = "Sin información del horario";
      document.getElementById("horario-day").style.color = "black";
      document.getElementById("horario-day").innerHTML = "No disponible";
      document.getElementById("horario-text").style.color = "black";
    }
    else{
      //Contar los numeros de digitos de los minutos
      const digitos = periods[day].close.minutes.toString().length;
      const digitosAbierto = periods[day].open.minutes.toString().length;
      if(digitosAbierto == 2){
      isOpen.openingTime = periods[day].open.hours + ":" + periods[day].open.minutes;
      }else if(digitosAbierto == 1){
        isOpen.openingTime = periods[day].open.hours + ":" + periods[day].open.minutes +"0";
      }
  
      if(digitos == 2){
        isOpen.closingTime = periods[day].close.hours + ":" + periods[day].close.minutes;
      }else if(digitos == 1){
        isOpen.closingTime = periods[day].close.hours + ":" + periods[day].close.minutes + "0";
      }
  
      if (placeInfo.opening_hours.isOpen() === true) {
        document.getElementById("horario-text").innerHTML = '<a style= "color: green"> Cierra a las ' + isOpen.closingTime + ' hrs</a>';
        document.getElementById("horario-day").innerHTML =  '<a style= "color: green"> Cierra a las ' + isOpen.closingTime + ' hrs</a>';
        document.getElementById("horario-text").style.color = "green";
        document.getElementById("horario-day").style.color = "green";
      } else if (placeInfo.opening_hours.isOpen() === false) {
          if(placeInfo.opening_hours.weekday_text[day] == "lunes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "martes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "miércoles: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "jueves: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "viernes: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "sábado: Cerrado" || placeInfo.opening_hours.weekday_text[day] == "domingo: Cerrado"){
            document.getElementById("horario-text").innerHTML = '<a style= "color: red">Mañana sin servicio</a>';
            document.getElementById("horario-day").style.color = "red";
            document.getElementById("horario-day").innerHTML = '<a style= "color: red">Mañana sin servicio</a>';
            document.getElementById("horario-text").style.color = "red";
          }else if(placeInfo.opening_hours.periods[mañana] != null){
          const digitosAbiertomañana = periods[mañana].open.minutes.toString().length;
          if(digitosAbiertomañana == 2){
            isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes;
          }else{
            isOpen.openingTimeMañana = periods[mañana].open.hours + ":" + periods[mañana].open.minutes +"0";
          }
          document.getElementById("horario-text").innerHTML = '<a style= "color: green">Abre mañana, ' + isOpen.openingTimeMañana + ' hrs</a>';
          document.getElementById("horario-day").innerHTML = '<a style= "color: green">Abre mañana, ' + isOpen.openingTimeMañana + ' hrs</a>';
          document.getElementById("horario-text").style.color = "green";
          document.getElementById("horario-day").style.color = "green";
          }
          else{
            document.getElementById("horario-text").innerHTML = '<a style= "color: red">Hoy cerrado</a>';
            document.getElementById("horario-day").style.color = "red";
            document.getElementById("horario-day").innerHTML = '<a style= "color: red">Hoy cerrado</a>';
            document.getElementById("horario-text").style.color = "red";
          }
      }
    }
  }else{
    document.getElementById("horario-text").innerHTML = "Sin información del horario";
    document.getElementById("horario-day").style.color = "black";
    document.getElementById("horario-day").innerHTML = "No disponible";
    document.getElementById("horario-text").style.color = "black";
  }
}