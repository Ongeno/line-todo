import Database from 'better-sqlite3';
import path from 'path';

// 创建数据库连接
const db = new Database(path.join(process.cwd(), 'timeline.db'));

// SQLite表信息的接口定义
interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

// 检查是否需要添加titleOffset列
const checkAndAddTitleOffsetColumn = () => {
  // 检查nodes表中是否已经有titleOffset列
  const columns = db.prepare("PRAGMA table_info(nodes)").all() as TableColumn[];
  const hasTitleOffset = columns.some((column: TableColumn) => column.name === 'titleOffset');
  
  // 如果没有titleOffset列，添加它
  if (!hasTitleOffset) {
    db.prepare("ALTER TABLE nodes ADD COLUMN titleOffset TEXT").run();
    console.log("Added titleOffset column to nodes table");
  }
};

// 初始化数据库表
db.exec(`
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    titleOffset TEXT
  );

  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    nodeId TEXT NOT NULL,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (nodeId) REFERENCES nodes(id)
  );
  
  CREATE TABLE IF NOT EXISTS timeline_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    startDate TEXT NOT NULL,
    endDate TEXT NOT NULL
  );
`);

// 检查并添加新列（对于已有的数据库）
checkAndAddTitleOffsetColumn();

export default db; 