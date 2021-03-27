const puppeteer = require('puppeteer');
const nodemailer = require('nodemailer');
let fs = require('fs'),
    PDFParser = require("pdf2json");
require('dotenv').config()
 
let pdfParser = new PDFParser();
let listaNomes = ["ZULMIRA CANDIDA DA SILVA", "ZULY CARLOS LIMA", "MARIA LAÉLIA"];

//var rows = {}; // indexed by y-position

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
//const pdfFiles = "i[class='fa fa-download']";
const linkElements = "//i[contains(@class, 'fa fa-download')]/../..";
const nomes = ["Maria LaéLia Lima Nogueira"]

var numberOfEmailsSent = 0;

(async () => {

  //do{
    await openSiteDownloadFiles(vacinaUrl, linkElements, nomes);

    //console.log('Nomes não encontrados');

    //await sleep(180000); // 3 min

  //}while (numberOfEmailsSent < 5);
  
  //console.log('Processo parou por excesso de emails');
  //process.exit(1);

})();

async function openSiteDownloadFiles(url,linkElements,nomes) {
  const browser = await puppeteer.launch({headless:true});
  const page = await browser.newPage();
  await page.goto(url);
  await sleep(2000);
  const linkElementsList = await page.$x(linkElements);
  if (linkElementsList){
    for (let i = 0; i < linkElementsList.length; i++){
      let property = await linkElementsList[i].getProperty('href');
      let pdfUrl =  await property.jsonValue();
      let pdfName = `Lista${i}.pdf`;
      await downloadFileFromURL(pdfUrl, pdfName);
      ///*let rows = */convertPdfToObject(pdfName).then(() => {console.log('carai' + JSON.stringify(rows) + ' s ' + pilha[0])});
      console.log(`na teoria terminou a funcao de conversao`);
      console.log('rows: ' + JSON.stringify(pilha));

      //while (Object.keys(rows).length === 0){
        //console.log('aguardando');
        //sleep(1000);
      //}
      sleep(6000);
      console.log('sai do while');
      console.log(JSON.stringify(pilha));

      //console.log(`rows: ${rows}`);
      //let namesFound = await searchNamesInObject(nomes, rows);
      let namesFound = false;
      console.log('fim');
      if (namesFound){
        //Send email com lista de nomes encontrados
        const mailOptions = {
          from: process.env.user,
          to: process.env.destination,
          subject: 'Vacina disponivel!!',
          text: 'Pessoas encontradas: ' + namesFound
        };
        console.log('email enviado');
        /*transporter.sendMail(mailOptions, function(error, info){
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
            numberOfEmailsSent++;
          }
        });*/
      }
      else{
        console.log('nao achou')
      }
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
  //let rows = {};
  new pdfreader.PdfReader().parseFileItems(pdfName, function (err, item) {
    if (!item || item.page) {
      // end of file, or page
      printRows(rows);
      if (item){
        //console.log("PAGE:", item.page);
        rows = {}; // clear rows for next page
      }
    } else if (item.text) {
      // accumulate text items into rows object, per line
      (rows[item.y] = rows[item.y] || []).push(item.text);
    }
  });
}

async function searchNamesInObject(nomes, pdfName){
  console.log('vou fazer o parse');
  
}

var pilha = [];
let rows = {};

async function printRows(rows) {
  Object.keys(rows) // => array of y-positions (type: float)
    .sort((y1, y2) => parseFloat(y1) - parseFloat(y2)) // sort float positions
    .forEach((y) => pilha.push((rows[y] || []).join("")));//console.log((rows[y] || []).join("")));
}



/*async function readPDFPages(pdfName) {
  console.log(`lendo: ${pdfName}`);
  const pdf = await pdfjs.getDocument(pdfName);
  const numPages = pdf.numPages;
  console.log(`numPages: ${numPages}`);
  let listaPaginas = [];
  for (let i =1; i <= numPages; i++){
    listaPaginas[i] = i;
  }
  const pageNumbers = Array.from(listaPaginas);
  // Start reading all pages 1...numPages
  const promises = pageNumbers.map(pageNo => pdf.getPage(pageNo));
  // Wait until all pages have been read
  const pages = await Promise.all(promises);
  // You can do something with pages here.
  return pages;
}*/