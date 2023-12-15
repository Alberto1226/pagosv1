import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();

app.use(bodyParser.json());

// Función para generar la cadena encriptada
function generateEncryptedStringWithoutKeys(data) {
  const order = {
    tipoPlan: 1,
    terminal: 2,
    importe: 3,
    referencia: 4,
    clave: 5,
  };

  const valorClave = "SzXQUp554W";

  const updatedData = {};

  Object.keys(data)
    .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
    .forEach((key) => {
      updatedData[key] = data[key];
    });

  const sortedValuesWithoutKeys = Object.values(updatedData)
    .filter((value) => value !== undefined && value !== null)
    .join("");

  const combinedDataWithKey = sortedValuesWithoutKeys + valorClave;

  const hash = crypto
    .createHash("sha1")
    .update(combinedDataWithKey)
    .digest("hex");

  return { combinedDataWithKey, hash };
}

function generateEncryptedStringWithKeys(data) {
  const order = {
    tipoPlan: 1,
    terminal: 2,
    importe: 3,
    referencia: 4,
  };


  const updatedData = {};

  Object.keys(data)
    .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
    .forEach((key) => {
      updatedData[key] = data[key];
    });

  const sortedDataWithKeys = Object.keys(updatedData)
    .filter(
      (key) => updatedData[key] !== undefined && updatedData[key] !== null
    )
    .map((key) => `${key}=${updatedData[key]}`)
    .join("&");

  return { sortedDataWithKeys }; // Devolver un objeto con la clave sortedDataWithKeys
}

/**
 * encriptar id de la venta y la clave
 */
function encryptIdAndValorClave(combinedIdValorClave) {
  const encryptedIdValorClave = crypto
    .createHash("sha1")
    .update(combinedIdValorClave)
    .digest("hex");
  return encryptedIdValorClave;
}


/**
 * obtener resultado
 */

async function realizarSolicitudResultado(id, idCifrado) {
  const resultadoUrl = "https://www.prosepago.net/v2/resultadov2.ashx";
  const resultadoRequestBody = `&idsolicitud=${id}&cadenaEncriptada=${idCifrado}`;
  console.log("Body :", resultadoRequestBody);
  const resultadoResponse = await fetch(resultadoUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: resultadoRequestBody,
  });
  return resultadoResponse;
}



app.post("/nuevaventa", async (req, res) => {
  const {
    tipoPlan,
    terminal,
    pv,
    importe,
    referencia,
    correo,
    //terminalPuente,
  } = req.body;

  const { combinedDataWithKey, hash: cadenaEncriptada } =
    generateEncryptedStringWithoutKeys({
      tipoPlan,
      terminal,
      importe,
      referencia,
      correo,
      //terminalPuente,
    });

  const { sortedDataWithKeys } = generateEncryptedStringWithKeys({
    tipoPlan,
    terminal,
    importe,
    referencia,
    correo,
    pv,
    //terminalPuente,
  });

  console.log("Cadena Original:", combinedDataWithKey);
  console.log("Cadena Encriptada:", cadenaEncriptada);
  console.log("Cadena con keys:", sortedDataWithKeys);

  try {
    const baseUrl = "https://www.prosepago.net/v2/nuevaventav2.ashx";

    const requestBody = `&${sortedDataWithKeys}&cadenaEncriptada=${cadenaEncriptada}`;
    console.log("RequestBody:", requestBody);

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    if (response.ok) {
      //setTimeout(async () => {
      const data = await response.json();
      const id = data; // Guardar la respuesta en la variable global 'id'
      console.log(data);
      console.log(id);

      // Cifrar 'id' y 'valorClave'
      const valorClave = "SzXQUp554W"; // Considerando que esto ya está definido en tu código
      console.log(valorClave);

      const idCifradoSinEncriptar = id + valorClave;
      console.log("Cadena sin encriptar", idCifradoSinEncriptar);

      const idCifrado = encryptIdAndValorClave(idCifradoSinEncriptar);

      console.log("cadena encriptada", idCifrado);

      
      const resultadoResponse = await realizarSolicitudResultado(id, idCifrado);
      // Enviar solicitud POST a la nueva URL con 'idCifrado'
      /*const resultadoUrl = "https://www.prosepago.net/v2/resultadov2.ashx";
      const resultadoRequestBody = `&idsolicitud=${id}&cadenaEncriptada=${idCifrado}`;
      console.log("Body :", resultadoRequestBody);
      const resultadoResponse = await fetch(resultadoUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: resultadoRequestBody,
      });*/
      
      //fin de pag
      //inicio de validacion de resultado
     
      if (resultadoResponse.ok) {
        
        let resultadoXMLText = await resultadoResponse.text();

        while (resultadoXMLText.trim() === "901") {
          await new Promise(resolve => setTimeout(resolve, 4000)); // Espera 4 segundos

          try {
            const resultadoResponseRepeat = await realizarSolicitudResultado(id, idCifrado);
        
            if (resultadoResponseRepeat.ok) {
              resultadoXMLText = await resultadoResponseRepeat.text();
              console.log("resultado", resultadoXMLText);
            } else {
              throw new Error("Error en la solicitud repetida");
            }
          } catch (error) {
            console.log("Error en la solicitud repetida:", error.message);
            // Manejar este error específico o lanzar uno nuevo según sea necesario
          }
        }

        if (resultadoXMLText.trim() !== "901") {
          const encodedXML = Buffer.from(resultadoXMLText).toString('base64');
          res.status(200).json({ encodedXML });
        } else {
          res.status(500).send("Se alcanzó el límite de intentos o se obtuvo un resultado no válido.");
        }
        
      }  else {
        res.status(resultadoResponse.status).send("Error al obtener resultados");
      }
    //}, 20000); // Esperar 20 segundos (20000 milisegundos)
    } else {
      res.status(response.status).send("Error");
    }
  } catch (error) {
    res.status(500).send("Error interno en el servidor");
  }
});

app.listen(3000, () => {
  console.log("Servidor iniciado en el puerto 3000");
});
