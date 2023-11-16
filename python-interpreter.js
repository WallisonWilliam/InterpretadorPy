function parse(code) {
  // divide o código em linhas e palavras e parenteses

  const lines = code.split("\n");
  const ast = [];
  for (let line of lines) {
    const tokens = line.split(" ");
    const lineAst = [];
    for (let token of tokens) {
      if (token.length > 0) {
        lineAst.push(token);
      }
    }
    ast.push(lineAst);
  }
  return ast;
}

function evaluate(ast) {
  var vars = {};
  var output = "";
  for (let line of ast) {
    console.log("Line: " + line);
    const [first, ...rest] = line;
    console.log(first);

    if (line[1] === "=") {
      // Variable assignment
      vars[line[0]] = Number(line[2]);
    } else if (line[0] === "print") {
      output += handlePrint(line, vars);
    } else if (line.length === 3) {
      // Arithmetic operation
      var op1 = line[0] in vars ? vars[line[0]] : Number(line[0]);
      var op2 = line[2] in vars ? vars[line[2]] : Number(line[2]);
      switch (line[1]) {
        case "+":
          output += op1 + op2 + "<br>";
          break;
        case "-":
          output += op1 - op2 + "<br>";
          break;
        case "*":
          output += op1 * op2 + "<br>";
          break;
        case "/":
          output += op1 / op2 + "<br>";
          break;
      }
    }
  }
  console.log(vars);
  return output;
}

function handlePrint(line, variables) {
  var output = "";
  console.log("handleprint");
  console.log(line);
  for (let i = 1; i < line.length; i++) {
    var value = line[i];
    console.log("value: " + value);

    if (value in variables) {
      output += variables[value] + "<br>";
    } else if (!isNaN(value)) {
      output += Number(value) + "<br>";
    }
  }

  console.log("handleprint output");
  console.log(output);

  return output;
}

function executePython(e) {
  e.preventDefault();
  const code = document.getElementById("pythonCode").value;
  const ast = parse(code);
  console.log(ast);
  const output = evaluate(ast);
  document.getElementById("output").innerHTML = output;
}

// Use the interpreter
window.onload = function () {
  const button = document.getElementById("executeButton");
  button.addEventListener("click", executePython);

  const spaceNote = document.createElement("p");
  spaceNote.classList.add("note-space");
  spaceNote.innerHTML = "Cada token separado por espaço, pfv 🥺🥺🥺";

  const notesDiv = document.getElementById("notes");
  notesDiv.appendChild(spaceNote);

  //   button.onclick = executePython;
};

//<p id="note-space">Cada token separado por espaço, pfv 🥺🥺🥺</p>;

/*
if (line[1] === "=") {
      // atribuição de variável
      vars[line[0]] = Number(line[2]);
    } else if (line[0] === "print") {
      output += handlePrint(line, vars);
      //   // Print statement
      //   var value = line[1];
      //   if (value in vars) {
      //     output += vars[value] + "<br>";
      //   } else if (!isNaN(value)) {
      //     output += Number(value) + "<br>";
      //   }
    } else if (line[0] === "print") {
      // Print statement
      var value = line[1];
      if (value in vars) {
        output += vars[value] + "<br>";
      } else if (!isNaN(value)) {
        output += Number(value) + "<br>";
      }
    } else if (line.length === 3) {
      // Arithmetic operation
      var op1 = line[0] in vars ? vars[line[0]] : Number(line[0]);
      var op2 = line[2] in vars ? vars[line[2]] : Number(line[2]);
      switch (line[1]) {
        case "+":
          output += op1 + op2 + "<br>";
          break;
        case "-":
          output += op1 - op2 + "<br>";
          break;
        case "*":
          output += op1 * op2 + "<br>";
          break;
        case "/":
          output += op1 / op2 + "<br>";
          break;
      }
    }
*/
