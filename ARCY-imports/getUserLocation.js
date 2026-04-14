export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        ({ coords: { latitude, longitude } }) => {
          let coords = { lat: latitude, lng: longitude };
          resolve(coords);
        },
        () => {
          //alert("Ocurrio un error al obtener la ubicación");
        }
      );
    } else {
      alert("Tu navegador no dispone de geolocalización, por favor, actualizalo");
    }
  });
}


// TODO:

// /*
//  * El JSON que retorna tiene el siguiente formato:
//   {
//     name: nombre del lugar,
//     type: un arreglo con los tipos correspondientes al lugar 
//     address: dirección del lugar,
//     rating: calificación del lugar en escala de 1 a 5,
//     opening_hours:{
//       open_now: dice si el lugar se encuenta abierto o no,
//       periods: arreglo con información detallada de los hoararios de atencion,
//       weekday_text: arraglo con los horarios por día (los elementos tienen el formato "DIA": XX:XX am - XX:XX pm. Si esta cerrado el formato será "DIA": Cerrado)
//     },
//     phone_number: Numero de telefono del lugar,
//     website: URL del sitio del lugar,
//     review: es un arreglo  que almacena hasta 5 reseñas con la siguiente estructura [
//       {
//         author_name: nombre del autor,
//         author_url: cuenta de google+ del autor,
//         language: idioma de la reseña,
//         profile_photo_url: url de la foto de perfil del usuario,
//         rating: calificación que el usurio le dio al lugar,
//         relative_time_description: ,
//         text: texto de la reseña escrita,
//         time: ,
//       },
//       {

//       },...
//     ],
//     photoUrls: arreglo de hasta  con las URL de las fotos del sitio, las dimenciones maximas se definen mediente imgHeight y imgWidth
//   }
//  */

// //Dimenciones de las imagenes que se obtendran
// const imgHeight = 1000;
// const imgWidth = 1000; 