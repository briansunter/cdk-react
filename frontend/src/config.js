export  default function getConfig(){
    const url = window.location.href
    if (url.includes('localhost')){
        return  {api: "http://localhost:3000"}
    } else  if (url.includes('dev')) {
        return  {api: "https://api-dev.briansunter.com"}
}
    }
