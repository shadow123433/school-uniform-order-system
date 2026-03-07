const path = require("path"); //módulo nativo do Node.js que fornece utilitários para trabalhar com caminhos de arquivos e diretórios. Ele é usado para construir caminhos de forma segura e independente do sistema operacional, garantindo que o código funcione corretamente em diferentes ambientes.

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});  //caminho do arquivo .env, que está localizado na raiz do projeto, dois níveis acima do diretório atual (backend/config). O método path.resolve é usado para construir um caminho absoluto para o arquivo .env, garantindo que as variáveis de ambiente sejam carregadas corretamente, independentemente de onde o script seja executado.

const required = ["JWT_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD", "PORT"];

required.forEach((key) => {
  if (!process.env[key]) {
    console.error(`ERRO: ${key} não definido no .env`);
    process.exit(1);
  }
}); //se alguma das variáveis de ambiente essenciais não estiver definida, o sistema exibirá uma mensagem de erro e encerrará a execução, garantindo que o sistema não funcione sem as configurações necessárias.

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  PORT: process.env.PORT || 3000
};   //fazendo com que meu sistema possa ler as variaveis de ambiente definidas no arquivo .env, e garantindo que as variáveis essenciais estejam presentes para o funcionamento correto do sistema.