const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
const pEvent = require('p-event');

const util = require('util');
let fs = require('fs'),
    PDFParser = require("pdf2json");
require('dotenv').config()
 
let listaNomes = [
"MARIA LAELIA LIMA NOGUEIRA", 
"MARIA LAÉLIA LIMA NOGUEIRA", 
"FRANCISCA MOREIRA DOS SANTOS", 
"CARLOS RAMIRES GOMES", 
"MARIA SELI MOREIRA DOS SANTOS", 
"MARIA SELENI"];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.user,
    pass: process.env.pass
  }
});

const vacinaUrl = "https://coronavirus.fortaleza.ce.gov.br/listaVacinacao.html";
const linkElements = "//ul[contains(@id, 'boletinsAnteriores')]/li/a";
let numberOfEmailsSent = 0;

(async () => {

  do{
    try{
      await openSiteDownloadFiles(vacinaUrl, linkElements, listaNomes);
    }catch(error){
      const mailOptions = {
        from: process.env.user,
        to: process.env.destination,
        subject: 'Bot vacina caiu!!',
        text: 'Bot vacina caiu'
      };
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          numberOfEmailsSent++;
        }
      });
      console.log(error);
      process.exit(0);
    }
    console.log('Fim da iteração');

    await sleep(5000); // 5 min

  }while (numberOfEmailsSent < 3);
  
  console.log('Processo parou por excesso de emails');
  process.exit(1);

})();

async function openSiteDownloadFiles(url,linkElements,listaNomes) {
  const browser = await puppeteer.launch({headless:true});
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0); 
  await page.goto(url);
  await sleep(2000);
  const linkElementsList = await page.$x(linkElements);
  const firstLink = linkElementsList[0];
  if (firstLink){
    let property = await firstLink.getProperty('href');
    let pdfUrl =  await property.jsonValue();
    let pdfName = `Lista.pdf`;
    await downloadFileFromURL(pdfUrl, pdfName);
    let texto = await convertPdfToObject(pdfName);
    let listaNomesEncontrados = await searchNamesInObject(texto,listaNomes);
    if (listaNomesEncontrados.length){
      //Send email com lista de nomes encontrados
      const mailOptions = {
        from: process.env.user,
        to: process.env.destination,
        subject: 'Vacina disponivel!!',
        text: 'Pessoas encontradas: ' + listaNomesEncontrados
      };
      console.log('email enviado');
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          numberOfEmailsSent++;
        }
      });
    }
    else{
      console.log('nao achou');
    }    
  }
  await browser.close();
}

async function downloadFileFromURL(url, downloadLocation){
	try {
		const fetch = require('node-fetch');
		const { writeFile } = require('fs');
		const { promisify } = require('util');
		const writeFilePromise = promisify(writeFile);
		await fetch(url)
			.then(x => x.arrayBuffer())
			.then(x => {writeFilePromise(downloadLocation, Buffer.from(x));console.log(`Arquivo baixado da URL: ${downloadLocation}`)});
	} catch (error) {
		throw new Error(error)
	}
}

async function convertPdfToObject(pdfName){
  let texto;
  let pdfParser = new PDFParser(this,1);
  pdfParser.loadPDF(pdfName);
  //Wait for the pdfParser_dataReady event to be finished
  await pEvent(pdfParser, 'pdfParser_dataReady');
  let textFileName = `createdTextFile.txt`;
  try {
    fs.writeFileSync(textFileName, pdfParser.getRawTextContent());
  } catch (err) {
      console.error(err);
  }
  try {
    texto = fs.readFileSync(textFileName, 'utf8');
    console.log(`Carregou o texto do ${textFileName} na variável texto`);
    return texto;
  } catch (err) {
    console.error(err);
  }
}

async function searchNamesInObject(str,substrings){
  let listaNomesEncontrados = [];
    for (let i = 0; i < substrings.length; i++) {
       let substring = substrings[i].toLowerCase();
       if (str.toLowerCase().indexOf(substring) != - 1) {
         listaNomesEncontrados.push(substring);
       }
    }
    return listaNomesEncontrados; 
}