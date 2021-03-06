/*jslint node: true */
/*jslint es5: true */
/*jslint plusplus: true */
/*jslint regexp: true */
"use strict";

var http = require('http');
var util = require('util');
var spawn = require('child_process').spawn;
var os = require('os');
var url = require('url');
var colors = [ '#ff00bf', '#0040ff', '#ffbf00', '#80ff00',  '#ff0000', '#00fff', '#7f00ff', '#00ff40', '#ff00bf', '#ff0000', '#440084', '#008400', '#000044', '#004444' ];


function drawBackgroung(SVGId, width, height, minY) {
    var ii, SVGChunk = '';
    if (!minY) { minY = 0; }
 
    SVGChunk += '<polyline vector-effect="non-scaling-stroke" points="0,0 0,' + height + ' ' + 2 * width + ',' + height + ' ' + 2 * width + ',0 0,0" fill="#eeeeee" fill-opacity="0.6" />';
    SVGChunk += '<polyline id="axis' + SVGId + '" vector-effect="non-scaling-stroke" style="fill:none;stroke:#000000" points="0,0 0,' + height + ' ' + 2 * width + ',' + height + '"/>';

    if (minY === 0) {
        for (ii = 1; ii < 3; ii++) {
            SVGChunk += '<polyline  vector-effect="non-scaling-stroke" stroke-opacity="0.4" style="fill:none;stroke:#888888" points="0,' + (height - (ii * height / 2)) + ' ' + 2 * width + ',' + (height - (ii * height / 2)) + '"/>';
        }
    }

    return SVGChunk;
}

function endDrawGraph(SVGId, width, height, yCounter, graphHeader, fullGraphs) {
    var ii, SVGChunk = '', localMax = -Infinity, localMin = Infinity, theHeader, timeValue, yFactor = 1;
    
    theHeader = graphHeader.split(/;/);
    theHeader.shift();
    theHeader.shift();
    theHeader.shift();
    
    graphHeader = theHeader.join(';');
    theHeader = '';
    fullGraphs[0].shift();
    fullGraphs[0].shift();
    fullGraphs[0].shift();
    
    for (ii = 0; ii < fullGraphs[0].length; ii++) {
        if (parseInt(fullGraphs[2][ii], 10) > localMax) {
            localMax = parseInt(fullGraphs[2][ii], 10);
        }
        if (parseInt(fullGraphs[4][ii], 10) < localMin) {
            localMin = parseInt(fullGraphs[4][ii], 10);
        }
    }
    if (localMax === 0) {
        localMax = 1;
    }
    
    yFactor = (-(height / localMax));
    if (localMin < 0) {
        yFactor = (-(height / (localMax - localMin)));
    }
    SVGChunk += '\n<g id="g' + SVGId + '" transform="translate(10,' + yCounter + ')">';
    SVGChunk += '\n<g id="gf' + SVGId + '" transform="scale(' + (width / (24 * 3600)) + ',' + yFactor + ')" >\n';
    SVGChunk += drawBackgroung(SVGId, width * 100, -localMax);
    if (localMin < 0) {
        SVGChunk += drawBackgroung(SVGId, width * 100, -localMax + localMin, localMin);
    } else {
        SVGChunk += drawBackgroung(SVGId, width * 100, -localMax);
    }
    for (ii = 0; ii < fullGraphs[0].length; ii++) {
        theHeader = fullGraphs[0][ii];

        SVGChunk += '\n<polyline id="polyline0' + SVGId + 'p' + ii + '" style="fill:none;stroke:' + colors[ii] + '" points="';
        SVGChunk += fullGraphs[1][ii];
        SVGChunk += '" vector-effect="non-scaling-stroke" stroke-width="2" transform="translate(0,' + (-(localMax)) + ')" />';
      //  SVGChunk += 'scale(' + (width / (24 * 3600)) + ',' + (-(height / localMax)) + ')" /> ';
        
    }
    SVGChunk += '\n</g>\n';
    var headerX = 20, headerY = 0, headerTxt = '';
    for (ii = 0; ii < fullGraphs[0].length; ii++) {
        theHeader = fullGraphs[0][ii];
        headerTxt = fullGraphs[0][ii] + ' (Min:' + fullGraphs[4][ii] + '/Max:' + fullGraphs[2][ii] + ')';
        SVGChunk +=  '\n<text text-anchor="start" x="' + headerX    + '" y="' + (height + 40 + headerY)  + '" fill="' + colors[ii] + '">';
        SVGChunk +=  headerTxt + '</text>';
        headerX += headerTxt.length * 10;
        if (headerX > width) {
            headerX = 0;
            headerY += 16;
        }
    }
    
    for (ii = 1; ii <= 8 * 2; ii++) {
        timeValue = parseInt((24 * ii / 8) % 24, 10) + ':00';
        SVGChunk += '<text text-anchor="middle" y="' + (height + 20) + '" x="' + parseInt((ii * width) / 8, 10) + '"  fill="#000000">' + timeValue + '</text>';
        SVGChunk += '<polyline  vector-effect="non-scaling-stroke" stroke-opacity="0.5" style="fill:none;stroke:#000000" points="' + parseInt((ii * width) / 8, 10) + ',' + height + ' ' + parseInt((ii * width) / 8, 10) + ',' + (height - 20) + '"/>';
    }
    for (ii = 1; ii < 24 * 2; ii++) {
        SVGChunk += '<polyline  vector-effect="non-scaling-stroke" stroke-opacity="0.5" style="fill:none;stroke:#000000" points="' + parseInt((ii * width) / 24, 10) + ',' + height + ' ' + parseInt((ii * width) / 24, 10) + ',' + (height - 10) + '"/>';
    }
    SVGChunk += '\n<text text-anchor="start" x="10" y="20" fill="#000000">' +  localMax + '</text>';
    if (localMin < 0) {
        SVGChunk += '\n<text text-anchor="middle" x="8" y="' + (height * (localMax / (localMax - localMin)) + 20) + '" fill="#000000">0</text>';
    } else {
        SVGChunk += '\n<text text-anchor="middle" x="8" y="' + (height + 20) + '" fill="#000000">0</text>';
    }
    
    SVGChunk += '\n<text text-anchor="middle" x="' + width  + '" y="0" fill="#888888">' + graphHeader + '</text>';

        
    SVGChunk += ' \n</g>';
    return SVGChunk;
}
function globalCall(lines, width, height) {
    var ts, i = 0, j, k, l, ii, header = '', prevHeader = '', percentCol, relativeCol, globalData, workingData, theData, SVGBody, SVGId,  exHeader, headerA, theHeader, yCounter, dataLine, headerLine, anoLine, dataArray, SVGHeader;
    if (lines === 'Empty data!') {
        SVGBody = 'Empty data : try again with data or wait for data or check your args';
    } else {
    
        SVGId = 0;

        dataArray = [];
        exHeader = '';
        headerA = [];

        globalData = [];
        SVGBody = '<g><text text-anchor="middle" x="' + width / 2  + '" y="30">Hostname : ' + os.hostname() + ' ( ' + os.type() + ' / ' + os.arch() + ' / ' + os.release() + ')</text></g>';
        yCounter = 60;

        while (i < lines.length) {
            dataLine = lines[i];
            if (dataLine.match(/^# /)) {
                //headers
                header = dataLine;

                globalData[header] = [];
                if (prevHeader !== header) {
                    if (prevHeader !== '') {
                        SVGBody += endDrawGraph(SVGId, width, height, yCounter, prevHeader, globalData[prevHeader]);
                        yCounter += height + 120;
                        SVGId++;
                    }


                    prevHeader = header;
                }

                //relative or percent
                headerA = header.split(/;/);
                globalData[header][0] = header.split(/;/);
                globalData[header][1] = [];
                globalData[header][2] = [];
                globalData[header][3] = [];
                globalData[header][4] = [];

                for (j in headerA) {
                    globalData[header][1][j] = '';//polyline
                    globalData[header][2][j] = -1000000;//max
                    globalData[header][3][j] = -1;//time+ // -1 instead of 0 is a trick
                    globalData[header][4][j] = 1000000;//min

                }

            } else if (dataLine) {
                workingData = dataLine.split(/;/);

                //maybe collect hasn't started at 00:00
                // timestamp :2015-03-14 15:22:01 UTC
                if (globalData[header][3][2] === -1) {
                    globalData[header][3][2] = 0; //here's the trick
                    var ts1 = workingData[2].split(/\s/);
                    var ts2 = ts1[1].split(/:/);
                    for (ii = 3; ii < workingData.length; ii++) {
                        globalData[header][3][ii - 3] = parseInt(ts2[0], 10) * 60 * 60 + parseInt(ts2[1], 10) * 60 + parseInt(ts2[2], 10);
                    }
                }

                for (ii = 3; ii < workingData.length; ii++) {


                    theData = workingData[ii];



                    globalData[header][3][ii - 3] += parseInt(workingData[1], 10);
                    globalData[header][1][ii - 3] += ' ' + parseInt(globalData[header][3][ii - 3], 10) + ',' + theData;
                    if (theData > parseInt(globalData[header][2][ii - 3], 10)) {
                        globalData[header][2][ii - 3] = theData;
                    }
                    if (theData < parseInt(globalData[header][4][ii - 3], 10)) {
                        globalData[header][4][ii - 3] = theData;
                    }


                }
            }
            i++;
        }

        //Last graph
        SVGBody += endDrawGraph(SVGId, width, height, yCounter, prevHeader, globalData[prevHeader]);


        SVGHeader = '<?xml version="1.0"?>\n';
        SVGHeader += '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ';
        SVGHeader += '"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n';
        SVGHeader += '<svg xmlns="http://www.w3.org/2000/svg" ';
        SVGHeader += 'width="' + (2 * width + 20) + '" height="' + (yCounter + height + 60) + '"  viewPort="0 0 ' + width + ' ' + height + '">\n';
        SVGBody =  SVGHeader + SVGBody + '\n</svg>';
    }
    
    return SVGBody;
}

function workAgain(input) {
    var i, j, preOutput, preOutputSize, output = [], line, temp = [], header, headerAdd, headerTxt, b;
    if (input.length > 0) {
        preOutput = input.split('\n');
        preOutputSize = preOutput.length;

        i = 0;
        header = '';
        headerAdd  = 0;
        headerTxt = '';
        while (i < preOutputSize) {
            line = preOutput.shift();
            if (line.match(/^#/)) {
                header = line;
                if (!temp[header]) {
                    temp[header] = [];
                }
            }
            if (!line.match(/LINUX-RESTART/)) {
                temp[header].push(line);
            }
            i++;
        }

        for (header in temp) {
            if (header.match(/;[A-Z]+;/)) {
                var header2, c, txt;
                headerAdd = 3;
                b = header.split(/;/);
                txt = b[headerAdd];
                b.splice(headerAdd, 1);
                b[headerAdd - 1] += txt;
                header2 = b.join(";");
                for (j = 1; j < temp[header].length; j++) {
                    b = temp[header][j].split(/;/);
                    c = ':' + b[headerAdd];
                    b.splice(headerAdd, 1);
                    if (!temp[header2 + c]) {
                        temp[header2 + c] = [];
                    }
                    temp[header2 + c].push(b.join(";"));
                }
                delete temp[header];
            }
        }

        for (header in temp) {
            temp[header].unshift(header);
        }

        for (i in temp) {
            for (j = 0; j < temp[i].length; j++) {
                output.push(temp[i][j]);
            }
            temp[i] = [];
        }
    }
    else {
        output ='Empty data!';
    }
    return output;
}

http.createServer(function (req, res) {
    var commandObj, stdOut = '', txtCmd = ['LC_ALL=C', 'sadf', '-d'];
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var argOfsar = '-A', file;

    if (query) {
        if (query.file) {
            file = query.file;
            txtCmd.push(file);
        }

        if (query.arg) {
            argOfsar = query.arg;
        }
    }
    txtCmd.push('--');
    txtCmd.push(argOfsar);
    
    
    // task creation and system switching activity, swapping statistics,  paging statistics, I/O and transfer rate statistics,
    // memory statistics, memory utilization statistics, Report swap space utilization statistics, hugepages utilization statistics.
//    commandObj = spawn('env', ['LC_ALL=C', 'sadf', '-d', '/var/log/sysstat/sa14', '--', '-w', '-W', '-B', '-b', '-R', '-r', '-S', '-H']);
    commandObj = spawn('env', txtCmd);
    


    commandObj.stdout.on('data', function (data) {
        stdOut += data;
    });

    commandObj.stdout.on('end', function () {
        
    });

    commandObj.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
        res.writeHead(200, { 'Content-Type' : 'text/html;charset=utf-8'});
        res.write('Sorry : ' + data);
        res.end();
    });

    commandObj.on('close', function (code) {
        if (code === 0) {
            res.writeHead(200, { 'Content-Type' : 'text/html;charset=utf-8'});
            res.write(globalCall(workAgain(stdOut), 800, 300));
            res.end();
        }
        console.log('child process exited with code ' + code);

    });

}).listen(1337);