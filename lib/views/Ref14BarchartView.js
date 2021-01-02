/*-------------------------------------------------------------------- 

   Module: REF 14 Results Dashboard - Bar chart View

   References: Code taken and adapted from
          - F21DV Live Examples 
          - Mike Bostock's Examples

---------------------------------------------------------------------- */

"use safe"

function barchart(targetDOMelement) {

	var barchartObject = {};

//=================== PUBLIC FUNCTIONS =========================//


	barchartObject.loadAndRenderDataset = function (data) {
		dataset=data.map(d=>d); //create local copy of references so that we can sort etc.
		render();
		return barchartObject;
	}

	barchartObject.overrideDataFieldFunction = function (dataFieldFunction) {
		dataField = dataFieldFunction;
		return barchartObject;
	}

	barchartObject.overrideKeyFunction = function (keyFunction) {
		//The key function is used to obtain keys for GUP rendering and
		//to provide the categories for the y-axis
		//These valuse should be unique
		GUPkeyField = yAxisCategoryFunction = keyFunction;
		return barchartObject;
	}

	barchartObject.overrideTooltipFunction = function (toolTipFunction) {
		tooltip = toolTipFunction;
		return barchartObject;
	}

	barchartObject.appendedMouseOverFunction = function (callbackFunction) {
		appendedMouseOverFunction = callbackFunction;
		render();
		return barchartObject;
	}

	barchartObject.appendedMouseOver2Function = function (callbackFunction) {
		appendedMouseOver2Function = callbackFunction;
		render();
		return barchartObject;
	}
	
	barchartObject.appendedMouseOutFunction = function (callbackFunction) {
		appendedMouseOutFunction = callbackFunction;
		render();
		return barchartObject;
	}

	barchartObject.appendedMouseOut2Function = function (callbackFunction) {
		appendedMouseOut2Function = callbackFunction;
		render();
		return barchartObject;
	}

	barchartObject.overrideClickFunction = function (fn) {
		clickFunction = fn;
		render(); //Needed to update DOM if they exist
		return barchartObject;
	}	

	barchartObject.overrideMouseOverFunction = function (callbackFunction) {
		mouseOverFunction = callbackFunction;
		render();
		return barchartObject;
	}

	barchartObject.maxValueOfDataField = function (max) {
		maxValueOfDataset = max;
		maxValueOfDataField=function(){return maxValueOfDataset};
		return barchartObject;
	}

	barchartObject.render = function (callbackFunction) {
		render(); //Needed to update DOM
		return barchartObject;
	}

	//=================== PRIVATE VARIABLES ====================================

	//Width and height of svg canvas
	var svgWidth = 500;
	var svgHeight = 600;
	var dataset = [];
	var xScale = d3.scaleLinear();
	var yScale = d3.scaleBand(); //This is an ordinal (categorical) scale
	var yAxisIndent = 150;
	var maxValueOfDataset; //For manual setting of bar length scaling (only used if .maxValueOfDataset() public method called)

	//=================== INITIALISATION CODE ====================================

	//Declare and append SVG element
	var svg = d3
		.select(targetDOMelement)
		.append("svg")
		.attr("width", svgWidth)
		.attr("height", svgHeight)
		.classed("barchart",true);

	//Declare and add group for y axis
	var yAxis = svg
		.append("g")
		.classed("yAxis", true);


	//Declare and add group for x axis
	var xAxis = svg
		.append("g")
		.classed("xAxis", true);

	//===================== ACCESSOR FUNCTIONS =========================================

	var dataField = function(d){return d.datafield} //The length of the bars
	var tooltip = function(d){return  d.key + ": "+ d.datafield} //tooltip text for bars
	var yAxisCategoryFunction = function(d){return d.key} //Categories for y-axis
	var GUPkeyField = yAxisCategoryFunction; //For 'keyed' GUP rendering (set to y-axis category)


	//=================== OTHER PRIVATE FUNCTIONS ====================================
	var maxValueOfDataField = function(){
		//Find the maximum value of the data field for the x scaling function using a handy d3 max() method
		//This will be used to set (normally used )
		return d3.max(dataset, dataField)
	};

	var appendedMouseOutFunction = function(){};
	var appendedMouseOut2Function = function(){};
	var appendedMouseOverFunction = function(){};
	var appendedMouseOver2Function = function(){};

	var mouseOverFunction = function (d,i){
        d3.select(this).classed("highlight", true).classed("noHighlight", false);
		appendedMouseOverFunction(d,i)
		appendedMouseOver2Function(d,i);
	}

	var mouseOutFunction = function (d,i){
        d3.select(this).classed("highlight", false).classed("noHighlight", true);
		appendedMouseOutFunction(d,i)
		appendedMouseOut2Function(d,i);
	}

	var clickFunction = function (d,i){};

	function render () {
		updateScalesAndRenderAxes();
		GUP_bars();
	}

	function updateScalesAndRenderAxes(){
		//Set scales to reflect any change in svgWidth, svgHeight or the dataset size or max value
		xScale
			.domain([0, maxValueOfDataField()])
			.range([0, svgWidth-(yAxisIndent+10)]);
		yScale
			.domain(dataset.map(yAxisCategoryFunction)) //Load y-axis categories into yScale
			.rangeRound([25, svgHeight-10])
			.padding([.1]);

		//Now render the y-axis using the new yScale
		var yAxisGenerator = d3.axisLeft(yScale);
		svg.select(".yAxis")
			.attr("transform", "translate(" + yAxisIndent + ",0)")
			.call(yAxisGenerator);

		//Now render the x-axis using the new xScale
		var xAxisGenerator = d3.axisTop(xScale);
		svg.select(".xAxis")
			.attr("transform", "translate(" + yAxisIndent + ",20)")
			.call(xAxisGenerator);
		};

	function GUP_bars(){
		//GUP = General Update Pattern to render bars

		//GUP: BIND DATA to DOM placeholders
		var selection = svg
			.selectAll(".bars")
			.data(dataset, GUPkeyField);


	   //GUP: ENTER SELECTION
		var enterSel = selection //Create DOM rectangles, positioned @ x=yAxisIndent
			.enter()
			.append("rect")
			.attr("x", yAxisIndent)

		enterSel //Add CSS classes
			.attr("class", d=>{
				return "key--"+ (GUPkeyField(d).replace(/[\W]+/g,"_"));
		})
			.classed("bars enterSelection", true)
			.classed("highlight", d=>d.highlight)

		enterSel //Size the bars
			.transition()
			.duration(1000)
			.delay(2000)
				.attr("width", function(d) {return xScale(dataField(d));})
				.attr("y", function(d, i) {return yScale(yAxisCategoryFunction(d));})
				.attr("height", function(){return yScale.bandwidth()});

		enterSel
			.append("title")
			.text(tooltip)



		//GUP UPDATE (anything that is already on the page)
		var updateSel = selection //update CSS classes
			.classed("noHighlight updateSelection", true)
			.classed("highlight enterSelection exitSelection", false)
			.classed("highlight", d=>d.highlight)

		updateSel	//update bars
			.transition()
			.duration(1000)
			.delay(1000)
				.attr("width", function(d) {return xScale(dataField(d));})
				.attr("y", function(d, i) {return yScale(yAxisCategoryFunction(d));})
				.attr("height", function(){return yScale.bandwidth()});


		updateSel
			.select("title")
			.text(tooltip)

		//GUP: Merged Enter & Update selections (so we don't write these twice)
		var mergedSel = enterSel.merge(selection)
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction)
			.on("click", clickFunction)	


		//GUP EXIT selection
		var exitSel = selection.exit()
			.classed("highlight updateSelection enterSelection", false)
			.classed("exitSelection", true)
			.transition()
			.duration(1000)
			.attr("width",0)
			.remove()
	};


	//================== IMPORTANT do not delete ==================================
	return barchartObject; // return the main object to the caller to create an instance of the 'class'

} //End of barchart() declaration
