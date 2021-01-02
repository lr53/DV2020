/*-------------------------------------------------------------------- 

   Module: REF 14 Results Dashboard - Scatterplot View

   References: Code taken and adapted from
          - F21DV Live Examples 
          - Mike Bostock's Examples

---------------------------------------------------------------------- */

"use safe"

function scatterplot(targetDOMelement) {

	var scatterplotObject = {};

//=================== PUBLIC FUNCTIONS =========================//

  	scatterplotObject.loadAndRenderDataset = function (data) {
  		dataset=data.map(d=>d); //create local copy of references so that we can sort etc.
      render();
  		return scatterplotObject;
  	}

  	scatterplotObject.overrideDataFieldFunction = function (dataFieldFunction) {
  		dataField = dataFieldFunction;
  		return scatterplotObject;
  	}

    scatterplotObject.overrideDataField2Function = function (dataField2Function) {
      dataField2 = dataField2Function;
      return scatterplotObject;
    }

    scatterplotObject.overrideKeyFunction = function (keyFunction) {
    //The key function is used to obtain keys for GUP rendering and
      GUPkeyField = keyFunction;
      return scatterplotObject;
    }

  	scatterplotObject.overrideTooltipFunction = function (toolTipFunction) {
  		tooltip = toolTipFunction;
  		return scatterplotObject;
  	}

  	scatterplotObject.render = function (callbackFunction) {
  		render(); //Needed to update DOM
  		return scatterplotObject;
  	}

    scatterplotObject.appendedMouseOverFunction = function (callbackFunction) {
      appendedMouseOverFunction = callbackFunction;
      render();
      return scatterplotObject;
    }

  
    scatterplotObject.appendedMouseOutFunction = function (callbackFunction) {
      appendedMouseOutFunction = callbackFunction;
      render();
      return scatterplotObject;
    }

    scatterplotObject.appendedMouseOver2Function = function (callbackFunction) {
      appendedMouseOver2Function = callbackFunction;
      render();
      return scatterplotObject;
    }

  
    scatterplotObject.appendedMouseOut2Function = function (callbackFunction) {
      appendedMouseOut2Function = callbackFunction;
      render();
      return scatterplotObject;
    }


//=================== PRIVATE VARIABLES ====================================

  //Width and height of svg canvas
  	var width = 500;
  	var height = 600;
  	var dataset = [];
  	var x = d3.scaleLinear();
  	var y = d3.scaleLinear(); //This is an ordinal (categorical) scale
    var xAxisIndent = 60;
    var yAxisIndent = 60;

    //=================== INITIALISATION CODE ====================================

    //Declare and append SVG element
    var svg = d3
      .select(targetDOMelement)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .classed("scatterplot",true);

    //Declare and add group for y axis (Scaled FTE)
    var yAxis = svg
      .append("g")
      .classed("yAxis", true);

   //Declare and add group for x axis (4* overall ratings)
    var xAxis = svg
      .append("g")
      .classed("xAxis", true);

//===================== ACCESSOR FUNCTIONS =========================================

    var dataField = function(d){return d.datafield} //for x coord
    var dataField2 = function(d){return d.dataField2}// for y coord 
    var tooltip = function(d){return  d.key + ": "+ d.datafield} //tooltip text
    var GUPkeyField = function(d){return d.key;}

//=================== OTHER PRIVATE FUNCTIONS ====================================
    var appendedMouseOutFunction = function(){};
    var appendedMouseOverFunction = function(){};
    var appendedMouseOut2Function = function(){};
    var appendedMouseOver2Function = function(){};
    
    var mouseOverFunction = function (d,i){
        d3.select(this).classed("highlight", true).classed("noHighlight", false);
        appendedMouseOverFunction(d,i);
        appendedMouseOver2Function(d,i);
    }

    var mouseOutFunction = function (d,i){
        d3.select(this).classed("highlight", false).classed("noHighlight", true);
        appendedMouseOutFunction(d,i);
        appendedMouseOut2Function(d,i);
    }
   
    var maxValueOfDataField = function(){
      //Find the maximum value of the data field for the x scaling function using a handy d3 max() method
      //This will be used to set (normally used )
      return d3.max(dataset, dataField)
    };

    var maxValueOfDataField2 = function(){
      //Find the maximum value of the data field for the x scaling function using a handy d3 max() method
      //This will be used to set (normally used )
      return d3.max(dataset, dataField2)
    };

    function render() {
  		renderAxes();
  		points();
  	}

    function renderAxes(){

  		x
        .domain([0, maxValueOfDataField()])
        .range([0, width-100]);
  		y
        .domain([0, maxValueOfDataField2()])
        .range([0, height-100]);

      var xAxisGenerator = d3.axisTop(x).ticks(width / 80);
          
      svg.select(".xAxis")
          .attr("transform", "translate(" + yAxisIndent + "," + xAxisIndent + ")")
          .call(xAxisGenerator); 

  		var yAxisGenerator = d3.axisLeft(y);
  		
      svg.select(".yAxis")
  			.attr("transform", "translate(" + yAxisIndent + "," + xAxisIndent + ")")
  			.call(yAxisGenerator); 

      var xLabel = svg.append("text")
                    .attr("transform", "translate(" + (xAxisIndent + 150) + "," + (yAxisIndent - 25) + ")")
                    .text("% of Overall 4 Star Ratings")

      var yLabel = svg.append("text")
                    .attr("transform", "translate(" + (xAxisIndent - 35) + "," + (yAxisIndent + 250) + ")rotate(-90)")
                    .text("Scaled FTE")        
  	};

    function points(){

      var selection = svg
  			.selectAll(".points")
  			.data(dataset, GUPkeyField);

      var enterSel = selection
  			.enter()
  			.append("circle")
        .attr("class", d=>{ //add CSS classes
          return "key--"+ (GUPkeyField(d).replace(/[\W]+/g,"_"));
        })
        .classed("points enterSelection", true)
        .classed("highlight", d=>d.highlight)

      enterSel
        .transition()
        .duration(1000)
        .delay(1000)
        .attr("cx", function(d) {
            return x(dataField(d)) + xAxisIndent
        })
        .attr("cy", function(d) { //if value is NaN, return 0
          if(isNaN(dataField2(d))){
            return 0 + yAxisIndent;
          }
          else{
            return y(dataField2(d)) + yAxisIndent
          }
        })
        .attr("r", 5)
      

      enterSel //add tooltip
        .append("title")
        .text(tooltip)

      //GUP UPDATE
      var updateSel = selection
          .classed("noHighlight updateSelection", true)// update CSS claases
          .classed("highlight enterSelection exitSelection", false)
      
      updateSel   
        .transition()
        .duration(1000)
        .delay(1000)
        .attr("cx", d => x(dataField(d)) + xAxisIndent)
        .attr("cy", function(d) {
          if(isNaN(dataField2(d))){
            return 0 + yAxisIndent;
          }
          else{
            return y(dataField2(d)) + yAxisIndent
          }
        })
        .attr("r", 5);

      // update tooltip    
      updateSel
        .select("title")
        .text(tooltip)

      var mergedSel = enterSel.merge(selection)
      .on("mouseover", mouseOverFunction)
      .on("mouseout", mouseOutFunction)

      // GUP Exit
       var exitSel = selection.exit()
            .classed("highlight updateSelection enterSelection", false)
            .classed("exitSelection", true)
            .transition()
            .duration(1000)
            .remove()
    }

    return scatterplotObject; // return the main object to the caller to create an instance of the 'class'
  }
