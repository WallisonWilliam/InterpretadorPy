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
    variables = {}; // Adiciona esta linha para limpar o estado das variáveis
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
        continue;
      }

      // Reconhecendo a palavra-chave 'if'
      if (input.substring(i, i + 2) === "if" && /\s/.test(input[i + 2])) {
        tokens.push({ type: "IF", value: "if" });
        i += 2; // Pular o comprimento da palavra 'if'
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

      // Reconhecendo os dois-pontos ':'
      if (currentChar === ":") {
        tokens.push({ type: "COLON", value: ":" });
        i++; // Pular o caractere ':'
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

    // No parser, atualize a função parseIfStatement para lidar com blocos de código com indentação:
    function parseIfStatement() {
      consumeToken("IF");
      var condition = parseExpression();
      consumeToken("COLON");
      consumeToken("INDENT"); // Assumindo que o lexer pode gerar um token INDENT
      var trueBranch = [];

      while (peekToken().type !== "DEDENT") {
        trueBranch.push(parseStatement());
      }
      consumeToken("DEDENT");

      return { type: "IfStatement", condition, trueBranch };
    }

    function parseIndentedBlock() {
      var statements = [];
      // Simplificação: assumindo um único statement no bloco
      statements.push(parseStatement());
      return { type: "Block", statements };
    }

    function parseStatement() {
      var nextToken = peekToken();
      if (!nextToken) {
        throw new Error("Unexpected end of input while parsing a statement");
      }

      switch (nextToken.type) {
        case "FUNCTION":
          return parseFunctionCall();
        case "IDENTIFIER":
          if (
            tokens[currentTokenIndex + 1] &&
            tokens[currentTokenIndex + 1].type === "OPERATOR" &&
            tokens[currentTokenIndex + 1].value === "="
          ) {
            // Este é o começo de uma atribuição
            return parseAssignment();
          } else {
            // Se não for uma atribuição, pode ser uma expressão ou um erro
            return parseExpression();
          }
        // Adicionar mais casos conforme necessário para outros tipos de declarações
        default:
          throw new Error(
            "Unknown statement starting with token: " + nextToken.type
          );
      }
    }

    function parseBlock() {
      var statements = [];
      matchToken("BRACE", "{"); // Verificar se tem uma chave abrindo o bloco
      while (!peekToken("BRACE", "}")) {
        // Enquanto não encontrar uma chave fechando o bloco
        statements.push(parseStatement()); // Analisar cada declaração dentro do bloco
      }
      matchToken("BRACE", "}"); // Consumir a chave que fecha o bloco
      return { type: "Block", statements }; // Retornar um objeto representando o bloco
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
      // Verifica se o próximo token é um parêntese abrindo
      if (
        peekToken() &&
        peekToken().type === "PARENTHESIS" &&
        peekToken().value === "("
      ) {
        consumeToken(); // Consome '('
        var expr = parseExpression(); // Processa a expressão interna
        if (
          !peekToken() ||
          peekToken().type !== "PARENTHESIS" ||
          peekToken().value !== ")"
        ) {
          throw new Error("Expected closing parenthesis");
        }
        consumeToken(); // Consome ')'
        return expr;
      }
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

      if (peekToken() && peekToken().type === "IF") {
        return parseIfStatement();
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
      case "IfStatement":
        if (evaluate(node.condition)) {
          node.trueBranch.forEach((statement) => evaluate(statement));
        }
        break;
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
