document.addEventListener("DOMContentLoaded", function () {
  var variables = {};

  function executePython() {
    var outputElement = document.getElementById("output");
    outputElement.innerText = ""; // Limpa a saída anterior
    var pythonCode = document.getElementById("pythonCode").value;
    try {
      var tokens = lexer(pythonCode);
      var parsed = parser(tokens);
      parsed.forEach(function (expression) {
        evaluate(expression); // Apenas avalia, não tenta imprimir o resultado
      });
    } catch (error) {
      outputElement.innerText = "Error: " + error.message; // Exibe erros no elemento de output.
    }
  }

  document
    .getElementById("executeButton")
    .addEventListener("click", executePython);

  function lexer(input) {
    var tokens = [];
    var i = 0;

    while (i < input.length) {
      // Pula espaços em branco
      while (input[i] === " ") {
        i++;
      }
      var currentChar = input[i];
      // Verifique se é uma função 'print'
      if (input.substring(i, i + 5) === "print" && input[i + 5] === "(") {
        tokens.push({ type: "FUNCTION", value: "print" });
        i += 5; // Pular o comprimento da palavra 'print'
        currentChar = input[i];
        console.log(currentChar);
        continue;
      }

      // Verificando se o caractere é um número
      if (
        /\d/.test(currentChar) ||
        (currentChar === "-" && /\d/.test(input[i + 1]))
      ) {
        var number = "";
        if (currentChar === "-") {
          number += currentChar;
          i++;
          currentChar = input[i];
        }
        while (/\d/.test(currentChar) || currentChar === ".") {
          number += currentChar;
          i++;
          currentChar = input[i];
        }
        tokens.push({ type: "NUMBER", value: parseFloat(number) });
        continue;
      }

      // Verificando operadores
      if (
        currentChar === "+" ||
        currentChar === "-" ||
        currentChar === "*" ||
        currentChar === "/"
      ) {
        tokens.push({ type: "OPERATOR", value: currentChar });
        i++;
        continue;
      }

      // Verificando parênteses
      if (currentChar === "(" || currentChar === ")") {
        tokens.push({ type: "PARENTHESIS", value: currentChar });
        i++;
        continue;
      }

      // Reconhecendo identificadores (para variáveis)
      if (/[a-zA-Z_]/.test(currentChar)) {
        var identifier = "";
        while (/[a-zA-Z0-9_]/.test(currentChar)) {
          identifier += currentChar;
          i++;
          currentChar = input[i];
        }
        tokens.push({ type: "IDENTIFIER", value: identifier });
        continue;
      }

      // Reconhecendo o operador de atribuição
      if (currentChar === "=") {
        tokens.push({ type: "OPERATOR", value: currentChar });
        i++;
        continue;
      }

      // Espaços e outros caracteres são ignorados
      i++;
    }

    return tokens;
  }

  function parser(tokens) {
    var currentTokenIndex = 0;
    var expressions = [];

    function consumeToken() {
      return tokens[currentTokenIndex++];
    }

    function parse() {
      var expressions = [];
      while (currentTokenIndex < tokens.length) {
        var expression = parseExpression();
        expressions.push(expression);
      }
      return expressions;
    }

    return parse(); // Return an array of expressions

    function parseFunctionCall() {
      var value = matchToken("FUNCTION").value;
      matchToken("PARENTHESIS", "("); // Consumir o parêntese de abertura
      var args = [];
      if (peekToken() && peekToken().value !== ")") {
        do {
          args.push(parseExpression());
          // Se o próximo token é uma vírgula, consuma-a
          if (peekToken() && peekToken().value === ",") {
            consumeToken(); // Consumir a vírgula
          }
        } while (peekToken() && peekToken().value !== ")");
      }
      matchToken("PARENTHESIS", ")"); // Consumir o parêntese de fechamento
      return { type: "FunctionCall", name: value, arguments: args };
    }

    function peekToken() {
      return tokens[currentTokenIndex];
    }

    function matchToken(expectedType, expectedValue) {
      var token = peekToken();
      if (!token) {
        throw new Error("Unexpected end of input");
      }
      if (
        token.type !== expectedType ||
        (expectedValue !== undefined && token.value !== expectedValue)
      ) {
        throw new Error(
          `Expected token type ${expectedType} but found ${token.type}`
        );
      }
      return consumeToken();
    }

    function parseNumber() {
      var numberToken = consumeToken();
      return { type: "Number", value: numberToken.value };
    }

    function parseExpression() {
      // Se for uma atribuição
      if (
        peekToken() &&
        peekToken().type === "IDENTIFIER" &&
        tokens[currentTokenIndex + 1] &&
        tokens[currentTokenIndex + 1].type === "OPERATOR" &&
        tokens[currentTokenIndex + 1].value === "="
      ) {
        return parseAssignment();
      }

      // Se for uma chamada de função
      if (peekToken() && peekToken().type === "FUNCTION") {
        return parseFunctionCall();
      }

      // Caso contrário, deve ser uma expressão matemática ou um número
      return parseBinaryExpression();
    }

    function parseBinaryExpression() {
      var node = parseTerm();

      while (
        peekToken() &&
        peekToken().type === "OPERATOR" &&
        (peekToken().value === "+" || peekToken().value === "-")
      ) {
        var operator = consumeToken();
        var right = parseTerm();
        node = {
          type: "BinaryExpression",
          operator: operator.value,
          left: node,
          right: right,
        };
      }

      return node;
    }

    function parseTerm() {
      var node = parseFactor();

      while (
        peekToken() &&
        peekToken().type === "OPERATOR" &&
        (peekToken().value === "*" || peekToken().value === "/")
      ) {
        var operator = consumeToken();
        var right = parseFactor();
        node = {
          type: "BinaryExpression",
          operator: operator.value,
          left: node,
          right: right,
        };
      }

      return node;
    }

    function parseAssignment() {
      var identifier = matchToken("IDENTIFIER");
      matchToken("OPERATOR", "=");
      var value = parseExpression();
      return { type: "Assignment", name: identifier.value, value: value };
    }

    function parseFactor() {
      if (peekToken() && peekToken().type === "NUMBER") {
        return { type: "Number", value: parseNumber().value };
      } else if (peekToken() && peekToken().type === "IDENTIFIER") {
        return {
          type: "Identifier",
          name: matchToken("IDENTIFIER").value,
        };
      } else if (peekToken() && peekToken().value === "(") {
        consumeToken(); // Consumindo '('
        var expr = parseExpression();
        if (peekToken() && peekToken().value === ")") {
          consumeToken(); // Consumindo ')'
        } else {
          throw new Error("Expected closing parenthesis");
        }
        return expr;
      }
      throw new Error("Unexpected token in factor");
    }

    return parseExpression(); // Inicia o processamento com uma expressão
  }

  function evaluate(node) {
    switch (node.type) {
      case "Assignment":
        variables[node.name] = evaluate(node.value);
        return variables[node.name];
      case "Identifier":
        if (variables.hasOwnProperty(node.name)) {
          return variables[node.name];
        }
        throw new Error("Undefined variable: " + node.name);
      case "Number":
        return node.value;
      case "FunctionCall":
        if (node.name === "print") {
          var evaluatedArgs = node.arguments.map((arg) => evaluate(arg));
          document.getElementById("output").innerText +=
            evaluatedArgs.join(" ") + "\n";
          return;
        }
        throw new Error("Unsupported function: " + node.name);
      case "BinaryExpression":
        var left = evaluate(node.left);
        var right = evaluate(node.right);
        switch (node.operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            if (right === 0) {
              throw new Error("Division by zero");
            }
            return left / right;
          default:
            throw new Error("Unsupported operator: " + node.operator);
        }
      default:
        throw new Error("Unsupported node type: " + node.type);
    }
    if (node.type === "FunctionCall") {
      switch (node.name) {
        case "print":
          // Avaliar os argumentos da função e imprimir
          var evaluatedArgs = node.arguments.map((arg) => evaluate(arg));
          document.getElementById("output").innerText +=
            evaluatedArgs.join(" ") + "\n";
          return null; // O print não retorna nada
        // Adicionar outros casos para diferentes funções aqui
      }
    }
  }

  document
    .getElementById("executeButton")
    .addEventListener("click", executePython);
});
// Restante do código para lexer, parser, e evaluate...
// (Continue com suas funções aqui fora do escopo do DOMContentLoaded)
