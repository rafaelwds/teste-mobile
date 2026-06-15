-- Schema do banco MySQL para o teste mobile.
-- A migration cria o database (se necessario) e estas tabelas.

CREATE TABLE IF NOT EXISTS empresa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS usuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  login VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  empresa_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS registro (
  id VARCHAR(36) PRIMARY KEY,
  empresa_id INT NOT NULL,
  usuario_id INT NOT NULL,
  tipo ENUM('COMPRA', 'VENDA') NOT NULL,
  data_hora DATETIME NOT NULL,
  descricao TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_registro_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  INDEX idx_registro_empresa (empresa_id),
  INDEX idx_registro_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS foto_registro (
  id VARCHAR(36) PRIMARY KEY,
  registro_id VARCHAR(36) NOT NULL,
  empresa_id INT NOT NULL,
  usuario_id INT NOT NULL,
  local_path TEXT NULL,
  remote_url TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_foto_registro FOREIGN KEY (registro_id) REFERENCES registro(id),
  CONSTRAINT fk_foto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
  CONSTRAINT fk_foto_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
  INDEX idx_foto_empresa (empresa_id),
  INDEX idx_foto_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
