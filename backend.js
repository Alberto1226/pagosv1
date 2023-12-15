import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import fetch from 'node-fetch';

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
  
    const valorClave = 'SzXQUp554W';
  
    const updatedData = {};
  
    Object.keys(data)
      .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
      .forEach(key => {
        updatedData[key] = data[key];
      });
  
    const sortedValuesWithoutKeys = Object.values(updatedData)
      .filter(value => value !== undefined && value !== null)
      .join('');
  
    const combinedDataWithKey = sortedValuesWithoutKeys + valorClave;
  
    const hash = crypto.createHash('sha1').update(combinedDataWithKey).digest('hex');
    
    return { combinedDataWithKey, hash };
  }

  function generateEncryptedStringWithKeys(data) {
    const order = {
      tipoPlan: 1,
      terminal: 2,
      importe: 3,
      referencia: 4,
      
    };
  
    //const valorClave = 'SzXQUp554W';
  
    /*const newDataWithoutKey = { ...data };
    delete newDataWithoutKey.clave;
  
    const newData = {
      ...newDataWithoutKey,
      clave: valorClave,
    };*/
  
    const updatedData = {};
  
    Object.keys(data)
      .sort((a, b) => (order[a] || Infinity) - (order[b] || Infinity))
      .forEach(key => {
        updatedData[key] = data[key];
      });
  
    const sortedDataWithKeys = Object.keys(updatedData)
      .filter(key => updatedData[key] !== undefined && updatedData[key] !== null)
      .map(key => `${key}=${updatedData[key]}`)
      .join('&');
  
    return { sortedDataWithKeys }; // Devolver un objeto con la clave sortedDataWithKeys
  }
  
  
  


app.post('/nuevaventa', async (req, res) => {
  const {
    tipoPlan,
    terminal,
    pv,
    importe,
    referencia,
    correo,
    //terminalPuente,
  } = req.body;

  const { combinedDataWithKey, hash: cadenaEncriptada } = generateEncryptedStringWithoutKeys({
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
    const baseUrl = 'https://www.prosepago.net/v2/nuevaventav2.ashx';

    const requestBody = `&${sortedDataWithKeys}&cadenaEncriptada=${cadenaEncriptada}`;
    console.log("RequestBody:", requestBody);

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (response.ok) {
      const data = await response.json();
      res.status(200).json(data);
    } else {
      res.status(response.status).send('Error');
    }
  } catch (error) {
    res.status(500).send('Error interno en el servidor');
  }
});

app.listen(3000, () => {
  console.log('Servidor iniciado en el puerto 3000');
});
