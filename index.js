const request = require('request-promise')
const regularRequest = require('request')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const url = require('./url')

// 確認有無輸入網址
if(url==''){
  console.log('請在 url.js 這支檔案輸入網址')
  return
}

// 目標網址
let targetUrl = url
let targetUrlNumber = null
let pageTitle = null

// 檢查網址是否有帶'page='參數，沒有則預設為1
if(targetUrl.match(/page=\d+/)) {
  targetUrlNumber = Number(targetUrl.match(/page=\d+/)[0].slice(5))
}else{
  targetUrl = targetUrl + '&page=1'
  targetUrlNumber = 1
}

let images = []
async function getHtml(){
  try{
    const result = await request.get(targetUrl)
    const $ = await cheerio.load(result)

    // 文章標題
    pageTitle = $('h1.title').text()

    // 總頁數
    const pageNumber = Number($($('#BH-pagebtn > p > a:last-child')[0]).text())

    // 建立資料夾
    if(!fs.existsSync(path.join(__dirname, `${pageTitle}`))){
      fs.mkdirSync(path.join(__dirname, `${pageTitle}`), { recursive: true })
    }

    for( let i = targetUrlNumber; i <= pageNumber; i++ ){
      try {
        const currentPage = targetUrl.replace(/page=\d+/, `page=${i}`)
        const result = await request.get(currentPage)
        const $ = await cheerio.load(result)
        imageUrls = $('.photoswipe-image').map(async (index, element) => {
          const imageUrl = $(element).attr('href')
          images.push(imageUrl)
          await saveImage(imageUrl, images.length)
        })
        console.log(`第${i}頁已下載完成`)
      } catch (err) {
        console.log(err)
      }
    }
  }
  catch (err){
    console.error(err)
  }
}

async function saveImage(imageUrl, number) {
  try {
    regularRequest
      .get(imageUrl)
      .on('error', function(err) {
        // console.error(err)
      })
      .on('response', (response) => {
        try {
          if(response.statusCode !== 200){
            throw `${imageUrl} Not Found`
          }
          response.pipe(fs.createWriteStream(path.join(__dirname, `${pageTitle}/${number}.png`)))
        } catch (err) {
          // console.error(err)
        }
      })
  } catch (err) {
    console.error(err)
  }
}

async function main(){
  try{
    await getHtml()
  }catch(err){
    console.log(err)
  }
}

main()