import app from "./app"


const main = async() => {
    const port = app.get("PORT")
    app.listen(port)
    console.log(`App running on port ${port}`)
}


main()
