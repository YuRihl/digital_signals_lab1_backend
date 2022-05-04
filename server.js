const { copyFileSync } = require('fs');
const http = require('http');
const fs = require('fs');
const Integral = require('sm-integral');

const server = http.createServer(async function (request, response) {
    response.writeHead(200, {'Content-Type': 'application/json', 
                             'Access-Control-Allow-Origin': '*', 
                             'Access-Control-Allow-Credentials' : true });

    let userUrl = new URL(request.url, `http://${request.headers.host}`);

    let requestObject = Object.fromEntries(new URLSearchParams(userUrl.search).entries());

    response.end(JSON.stringify(calculateAll(requestObject)));
})

server.listen(8080, () => {
    let {address, port} = server.address();
    console.log(`Server is listening on: http://${address}:${port}`);
});

function calculateAll({from, to, iterations, precision}){
    from = parsePI(from);
    to = parsePI(to);
    let step = (to - from) / 200;

    let result = {
        x: [],
        functionY: [],
        fourierY: [],
    };

    for(let i = from; i < to; i += 2 * Math.PI){
        let localTo = i + 2 * Math.PI;
        
        for(let x = i + step; x <= localTo; x += step){
            result.x.push(+x.toFixed(3));
            result.functionY.push(x > i && x <= (i + localTo) / 2 ? 0 : x);
            result.fourierY.push(+calculateFourier(x, i, localTo, iterations, precision).toFixed(3));
        }
    }

    return result;
}

function calculateFourier(x, from, to, iterations, precision){
    const a0 = calculateA(0, from, to);
    let sum = 0,
        previousSum = 1;
    let i = 1;

    fs.writeFileSync('fourier.txt', `Number of iterations: ${iterations}\n`);

    while(Math.abs(sum - previousSum) > precision && i <= iterations){
        const a = calculateA(i, from, to);
        const b = calculateB(i, from, to);

        fs.appendFileSync('fourier.txt', `a[${i}] = ${a}    b[${i}] = ${b}\n`);

        previousSum = sum;
        sum += a * Math.cos(i * x) + b * Math.sin(i * x);
        i++;
    }

    fs.appendFileSync('fourier.txt', `Average innacuracy is ${(sum + a0 / 2) / iterations}\n`);
    
    return a0 / 2 + sum;
}

function calculateA(k, from, to){
    let middle = (from + to) / 2;

    let integralFunction = function(x){
        return x > from && x <= middle ? 0 : x * Math.cos(k * x);
    }

    return (1 / Math.PI) * (Integral.integrate(integralFunction, from, middle) + Integral.integrate(integralFunction, middle, to));
}

function calculateB(k, from, to){
    let middle = (from + to) / 2;

    let integralFunction = function(x){
        return x > from && x <= middle ? 0 : x * Math.sin(k * x);
    }

    return (1 / Math.PI) * (Integral.integrate(integralFunction, from, middle) + Integral.integrate(integralFunction, middle, to));
}

function parsePI(string = ''){
    if(!/pi/i.test(string)) return +string;

    return /^-?pi$/i.test(string) ? +string.replace(/pi/i, Math.PI) : +string.match(/-?\d+(?:\.\d+)?(?=pi)/i)[0] * Math.PI;
}
