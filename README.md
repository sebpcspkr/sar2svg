# sar2svg
Service to convert sar data into svg data viewable into web browser


This is a service tool to convert sar data (From System performance tools for the Linux operating system, see https://github.com/sysstat/sysstat) into SVG format viewable into web browser.

It is written in Javascript. It runs server-side (with NodeJS or io.js).

Install
==========================
First, you'll need on the host you want to view :
  * the sysstat package
  * the sadc module of sysstat with ENABLED=true
  * the nodejs package

Then (the script has no dependency on fancy any npm, it only uses modules from the base nodejs distribution) :
  * Just run the script with your nodejs or io.js

Install and run example (on Debian)
```
  apt-get install sysstat nodejs
  sed -i  s/^ENABLED=\"false\"/ENABLED=\"true\"/g /etc/default/sysstat
  nodejs sar2svg.js &
``` 
If you haven't already installed and configured sysstat, you'll have to wait for the first collects (around 10 minutes).
Usage
=============================
Let assume your host IP is 127.0.0.1.
You can view via web browser : 
```
  * the graphs for "sar -A" of the current day 
``` 
http://127.0.0.1:1337/

```
  * the graphs for "sar -w" of the current day
```
  http://127.0.0.1:1337/?arg=-w
  
```
  * the graphs for "sar -wu" of the current day 
```  
  http://127.0.0.1:1337/?arg=-wu

```
  * the graphs for "sar -wu" of the file of yesterday (e.g. /var/log/sysstat/sa18) 
```
  http://127.0.0.1:1337/?arg=-wu&file=/var/log/sysstat/sa18

```
  * ...
```
Then, you can think of keeping some interesting parts of graphs and edit them into a SVG editor like Inkscape :
  * In your browser, View the source then "Save as ..." file.svg
  * Open file.svg with Inkscape and play with it.

Notes, warnings:
==========================
  * This service is not perfect, nor the code. Try it before deciding to use it.
  * When you open your svg file into Inkscape, consider selecting all and putting your stroke style width to 1 px.
  * You should probably better wait for the sar2svg directly into sysstat - https://github.com/sysstat/sysstat/issues/51 - which development started in Feb, 2016.

