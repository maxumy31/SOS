import axios from "axios"

function CreateURL(name) {
    return `https://registry.npmjs.org/${name}/latest`
}


async function RequestRepository(name) {
    const url = CreateURL(name)
    const resp = await axios(url)
    if(resp.status == 200 || resp.status == 201 || resp.status == 202) {
        return ValidateResponse(resp.data)
    } else {
        return null
    }
}

function ValidateResponse(data) {
    if(data == "Not Found") {return null}

    return {
        name : data.name,
        version : data.version,
        keywords: data.keywords,
        description: data.description,
        git_url: data.repository.url
    }

}

export default {RequestRepository}