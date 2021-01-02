/*-------------------------------------------------------------------- 

   Module: REF 14 Results Dashboard - Pie Chart View

   References: Code taken and adapted from
          - F21DV Live Examples 
          - Mike Bostock"s Examples
          - Zeroviscosity.com (for legend)

---------------------------------------------------------------------- */

function piechart(targetDOMelement) {
	//Here we use a function declaration to imitate a "class" definition
	//
	//Invoking the function will return an object (piechartObject)
	//    e.g. piechart_instance = piechart(target)
	//    This also has the "side effect" of appending an svg to the target element
	//
	//The returned object has attached public and private methods (functions in JavaScript)
	//For instance calling method "updateAndRenderData()" on the returned object
	//(e.g. piechart_instance) will render a piechart to the svg


	//Delare the main object that will be returned to caller
	var piechartObject = {};

	//=================== PUBLIC FUNCTIONS =========================
	//
	piechartObject.overrideDataFieldFunction = function (dataFieldFunction) {
		dataField = dataFieldFunction;
		return piechartObject;
	}

	piechartObject.overrideMouseOverFunction = function (callbackFunction) {
		mouseOverFunction = callbackFunction;
		layoutAndRender();
		return piechartObject;
	}

	piechartObject.overrideMouseOutFunction = function (callbackFunction) {
		mouseOutFunction = callbackFunction;
		layoutAndRender();
		return piechartObject;
	}

	piechartObject.render = function (callbackFunction) {
		layoutAndRender();
		return piechartObject;
	}

	piechartObject.loadAndRenderDataset = function (data) {
		console.log("from pie", data)
		dataset=data;
		layoutAndRender();
		return piechartObject;
	}

	//=================== PRIVATE VARIABLES ====================================
	//Width and height of svg canvas
	var svgWidth = 400;
	var svgHeight = 300;
	var dataset = [];
	var colorScale = d3.scaleOrdinal()
						.domain([0,4])
						.range(["#003249", "#007EA7", "#56CBF9", "#9AD1D4", "#CCDBDC"]);

	var legRectSize = 16;
	var legSpacing = 5;

	//=================== INITIALISATION CODE ====================================

	//Declare and append SVG element
	var svg = d3.select(targetDOMelement)
				.append("svg")
				.attr("width", svgWidth)
				.attr("height", svgHeight)
				.classed ("piechart",true);


	//Declare and append group that we will use tp center the piechart within the svg
	var grp = svg.append("g");
	

	//=================== PRIVATE FUNCTIONS ====================================

	var dataField = function(d){return d.dataField}

	var mouseOverFunction = function (d,i){
		d3.select(this).classed("highlight", true)
		layoutAndRender();
	}
	var mouseOutFunction = function (d,i){
		d.data.highlight = "noHighlight";
		layoutAndRender();
	}

	//Set up shape generator
	var arcShapeGenerator = d3.arc()
		.outerRadius(svgHeight/2)
		.innerRadius(svgHeight/4)
		.padAngle(0.03)
		.cornerRadius(8);

	function layoutAndRender(){
		//Taken and addapted from https://github.com/d3/d3-shape/blob/master/README.md#pie

		//Generate the layout
		var arcsLayout = d3.pie()
			.value(dataField)
			.sort(null)
			(dataset);

		//center the group within the svg
		grp.attr("transform", "translate("+[svgWidth/2, svgHeight/2]+")")

		//Now call the GUP
		GUP_pies(arcsLayout, arcShapeGenerator);

	}


	function GUP_pies(arcsLayout, arcShapeGenerator){

		//GUP = General Update Pattern to render pies

		//GUP: BIND DATA to DOM placeholders
		var selection = grp.selectAll(".path")
			.data(arcsLayout, function (d){return d.dataField})

		//GUP: ENTER SELECTION
		var enterSel = selection
			.enter()
			.append("path")
			.classed("noHighlight", true)
			.classed("highlight", false)
			.each(function(d) { this.dPrevious = d; }); // store d for use in tweening

			enterSel //Add CSS classes
				.classed("path enterSelection", true)
				.classed("highlight", d=>d.highlight)

		

		//GUP ENTER AND UPDATE selection
		var mergedSel = enterSel.merge(selection)

		mergedSel
			.attr("fill", function(d,i) {
				return colorScale(i);

			})
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction)
			.append("title")
				.text(function(d, i) { 

					if(i == 0){
					return "4* = " + d.data};
					if(i == 1){
					return "3* = " + d.data};
					if(i == 2){
					return "2* = " + d.data};
					if(i == 3){
					return "1* = " + d.data};
					if(i == 4){
					return "Unclassified = " + d.data};
				});

		mergedSel
			.transition()
			.duration(750)
			.attrTween("d", arcTween); //Use custom tween to draw arcs

		//GUP EXIT selection
		var exitSel = selection.exit()
			.remove()
			.classed("highlight updateSelection enterSelection", false)
			.classed("exitSelection", true)

		//legend code taken from http://zeroviscosity.com/d3-js-step-by-step/step-3-adding-a-legend
		var legend = grp.selectAll("legend")
						.data(colorScale.domain())
						.enter()
						.append("g")
						.attr("class", "legend")
						.attr("transform", function(d, i) {
    					var height = legRectSize + legSpacing;
    					var offset =  height * colorScale.domain().length / 2;
    					var hor = -2 * legRectSize;
   						var ver = i * height - offset;
    					return "translate(" + hor + "," + ver + ")";
  						});

			// add coloured square				
  			legend.append("rect")
  					.attr("width", legRectSize)
  					.attr("height", legRectSize)
  					.style("fill", colorScale)

  			// add text 			
  			legend.append("text")
  					.attr("x", legRectSize + legSpacing)
  					.attr("y", legRectSize - legSpacing)
  					.text(function(d, i) { 
  						if(i == 0){
					return "4*"};
					if(i == 1){
					return "3*"};
					if(i == 2){
					return "2*"};
					if(i == 3){
					return "1*"};
					if(i == 4){
					return "Unclassified";
  						}});
	};

	
	//Ignore this function unless you really want to know how interpolators work
	function arcTween(dNew) {
		//Create the linear interpolator function
		//this provides a linear interpolation of the start and end angles
		//stored "d" (starting at the previous values in "d" and ending at the new values in "d")
		var interpolateAngles = d3.interpolate(this.dPrevious, dNew);
		//Now store new d for next interpoloation
		this.dPrevious = dNew;
		//Return shape (path for the arc) for time t (t goes from 0 ... 1)
		return function(t) {return arcShapeGenerator(interpolateAngles(t)) };
	}


	//================== IMPORTANT do not delete ==================================
	return piechartObject; // return the main object to the caller to create an instance of the "class"

} //End of piechart() declaration	