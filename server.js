const express = require('./src/app')

const app = express()

function middlewareCheck(req, res, next) {
    if (req.headers?.token) {
        next()
    }
    res.send('Sorry, You are not registered yet')
    // throw new Error('Sorry, You are not registered yet')
}

app.bodyParse()


app.get('/get', (req, res) => {
    res.json([{ id: 1, name: 'Eshmat' }])
})


app.post('/create', (req, res) => {
    console.log(req.body)
    res.status(201).json({
        success: true,
        message: 'Successfully created'
    })
})

app.put('/:id', (req, res) => {
    console.log(req.params)
    console.log(req.query)
    console.log(req.headers)
    res.json(req.body)
})

app.delete('', (req, res) => {
    res.sendFile('aefhbevhrfjbhvhjk', 'C:\Users\nazar\OneDrive\Desktop\images\cat.jpg')
})



app.listen(9000, () => {
    console.log(9000)
})
