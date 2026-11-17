import { useEffect, useState } from 'react';
import {
  Shield, LockKeyhole, KeyRound, Plus, Search, Eye, EyeOff,
  Trash2, LogOut, Copy, Globe, UserRound, X, ShieldCheck,
  AlertCircle, ChevronRight, Fingerprint
} from 'lucide-react';
import {
  createVault, saveVault, openVault, protectSecret, revealSecret
} from './crypto';

const STORAGE_KEY = 'vaultlock-encrypted-vault';

export default function App() {
  const [stored, setStored] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [master, setMaster] = useState('');
  const [confirmMaster, setConfirmMaster] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', username: '', secret: '', second: '' });
  const [asking, setAsking] = useState(null);
  const [secondPassword, setSecondPassword] = useState('');
  const [visible, setVisible] = useState({});
  const [revealed, setRevealed] = useState({});

  const isFirstUse = !stored;

  async function enter() {
    setError('');
    if (master.length < 8) return setError('Use uma senha principal com pelo menos 8 caracteres.');
    setBusy(true);
    try {
      if (isFirstUse) {
        if (master !== confirmMaster) throw new Error('As senhas principais não coincidem.');
        const vault = await createVault(master);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(vault));
        setStored(JSON.stringify(vault));
        setItems([]);
      } else {
        const vault = await openVault(JSON.parse(stored), master);
        setItems(vault);
      }
      sessionPassword.set(master);
      setUnlocked(true);
      setMaster('');
      setConfirmMaster('');
    } catch {
      setError(isFirstUse ? 'Não foi possível criar o cofre.' : 'Senha principal incorreta ou cofre inválido.');
    } finally {
      setBusy(false);
    }
  }

  async function persist(nextItems) {
    const currentPassword = sessionPassword.current;
    const encrypted = await saveVault(nextItems, currentPassword);
    const value = JSON.stringify(encrypted);
    localStorage.setItem(STORAGE_KEY, value);
    setStored(value);
    setItems(nextItems);
  }

  // A senha fica apenas em memória enquanto o cofre está aberto.
  const sessionPassword = useSessionPassword();
  async function submitNewItem(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.secret || form.second.length < 8) {
      setError('Preencha o nome, a senha e uma segunda senha com pelo menos 8 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const protectedValue = await protectSecret(form.secret, form.second);
      const next = [{ id: crypto.randomUUID(), title: form.title.trim(),
        username: form.username.trim(), protectedValue }, ...items];
      await persist(next);
      setForm({ title: '', username: '', secret: '', second: '' });
      setModal(false);
      setError('');
    } catch {
      setError('Não foi possível salvar essa senha.');
    } finally {
      setBusy(false);
    }
  }

  async function unlockItem(e) {
    e.preventDefault();
    try {
      const value = await revealSecret(asking.protectedValue, secondPassword);
      setRevealed(prev => ({ ...prev, [asking.id]: value }));
      setVisible(prev => ({ ...prev, [asking.id]: true }));
      setAsking(null);
      setSecondPassword('');
      setError('');
    } catch {
      setError('Segunda senha incorreta.');
    }
  }

  async function removeItem(id) {
    if (!confirm('Tem certeza de que deseja excluir este cadastro?')) return;
    const next = items.filter(item => item.id !== id);
    await persist(next);
    setRevealed(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
  }

  function logout() {
    setUnlocked(false);
    setItems([]);
    setRevealed({});
    setVisible({});
    sessionPassword.set('');
  }

  const filtered = items.filter(item =>
    `${item.title} ${item.username}`.toLowerCase().includes(search.toLowerCase())
  );

  if (!unlocked) return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand-mark"><Shield size={27} /></div>
        <div className="brand-name">Vault<span>Lock</span></div>
        <p className="muted auth-subtitle">Suas senhas, protegidas em camadas.</p>
        <div className="auth-heading">
          <h1>{isFirstUse ? 'Crie seu cofre' : 'Bem-vindo de volta'}</h1>
          <p>{isFirstUse ? 'Defina uma senha principal para proteger seu cofre.' : 'Digite sua senha principal para continuar.'}</p>
        </div>
        <form onSubmit={enter} className="form-stack">
          <label>Senha principal</label>
          <div className="input-wrap"><LockKeyhole size={17}/><input autoFocus type="password" value={master} onChange={e => setMaster(e.target.value)} placeholder="Mínimo de 8 caracteres" /></div>
          {isFirstUse && <>
            <label>Confirme a senha principal</label>
            <div className="input-wrap"><LockKeyhole size={17}/><input type="password" value={confirmMaster} onChange={e => setConfirmMaster(e.target.value)} placeholder="Digite novamente" /></div>
          </>}
          {error && <div className="error"><AlertCircle size={16}/>{error}</div>}
          <button className="primary-btn" disabled={busy}>{busy ? 'Aguarde...' : isFirstUse ? 'Criar meu cofre' : 'Desbloquear cofre'} <ChevronRight size={18}/></button>
        </form>
        <div className="security-note"><ShieldCheck size={16}/><span>Criptografia local com AES-GCM e derivação de chave PBKDF2.</span></div>
      </div>
      <footer>VAULTLOCK <span>•</span> PRIVACIDADE EM PRIMEIRO LUGAR</footer>
    </main>
  );

  return (
    <main className="app-page">
      <header className="topbar">
        <div className="brand"><div className="brand-mark small"><Shield size={20}/></div><b>Vault<span>Lock</span></b></div>
        <button className="logout-btn" onClick={logout}><LogOut size={16}/> Bloquear cofre</button>
      </header>
      <section className="content">
        <div className="welcome-row">
          <div><div className="eyebrow"><Fingerprint size={15}/> COFRE PESSOAL</div><h1>Minhas senhas</h1><p className="muted">Cada cadastro tem uma segunda camada de proteção.</p></div>
          <button className="primary-btn add-btn" onClick={() => { setError(''); setModal(true); }}><Plus size={18}/> Nova senha</button>
        </div>
        <div className="stats">
          <div className="stat-card"><div className="stat-icon"><KeyRound size={19}/></div><div><strong>{items.length}</strong><span>Cadastros salvos</span></div></div>
          <div className="stat-card"><div className="stat-icon"><ShieldCheck size={19}/></div><div><strong>2 níveis</strong><span>De proteção</span></div></div>
        </div>
        <div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por serviço ou usuário..." /></div>
        {error && <div className="error page-error"><AlertCircle size={16}/>{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
        <div className="section-title"><h2>Seus acessos</h2><span>{filtered.length} itens</span></div>
        {filtered.length === 0 ? (
          <div className="empty"><div className="empty-icon"><LockKeyhole size={25}/></div><h3>{search ? 'Nenhum resultado' : 'Seu cofre está vazio'}</h3><p>{search ? 'Tente buscar por outro nome.' : 'Adicione seu primeiro acesso para começar.'}</p>{!search && <button className="secondary-btn" onClick={() => setModal(true)}><Plus size={16}/> Adicionar primeira senha</button>}</div>
        ) : <div className="vault-list">{filtered.map(item => (
          <article className="vault-item" key={item.id}>
            <div className="site-icon"><Globe size={20}/></div>
            <div className="item-info"><h3>{item.title}</h3><p><UserRound size={13}/>{item.username || 'Usuário não informado'}</p></div>
            <div className="secret-area">
              {visible[item.id] && revealed[item.id] ? <><code>{revealed[item.id]}</code><button className="icon-btn" title="Ocultar" onClick={() => setVisible(p => ({...p, [item.id]: false}))}><EyeOff size={17}/></button><button className="icon-btn" title="Copiar" onClick={() => navigator.clipboard.writeText(revealed[item.id])}><Copy size={16}/></button></> : <><span className="dots">••••••••••</span><button className="reveal-btn" onClick={() => {setAsking(item);setSecondPassword('');setError('');}}>Desbloquear <LockKeyhole size={14}/></button></>}
            </div>
            <button className="icon-btn delete-btn" title="Excluir" onClick={() => removeItem(item.id)}><Trash2 size={17}/></button>
          </article>
        ))}</div>}
        <div className="bottom-note"><ShieldCheck size={16}/> Os dados do cofre ficam criptografados neste navegador.</div>
      </section>

      {(modal || asking) && <div className="modal-backdrop" onMouseDown={e => {if(e.target === e.currentTarget){setModal(false);setAsking(null);}}}>
        <div className="modal">
          <button className="modal-close" onClick={() => {setModal(false);setAsking(null);}}><X size={19}/></button>
          {modal ? <>
            <div className="modal-icon"><Plus size={21}/></div><h2>Novo acesso</h2><p className="muted">Cadastre os dados e crie uma segunda senha para protegê-los.</p>
            <form onSubmit={submitNewItem} className="form-stack">
              <label>Nome do serviço</label><input value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Ex.: E-mail, Instagram..." />
              <label>Usuário ou e-mail</label><input value={form.username} onChange={e => setForm({...form,username:e.target.value})} placeholder="seu@email.com" />
              <label>Senha que deseja guardar</label><input type="password" value={form.secret} onChange={e => setForm({...form,secret:e.target.value})} placeholder="Digite a senha do serviço" />
              <label>Segunda senha de proteção</label><input type="password" value={form.second} onChange={e => setForm({...form,second:e.target.value})} placeholder="Mínimo de 8 caracteres" />
              <div className="hint"><LockKeyhole size={14}/> Essa segunda senha será solicitada para revelar a senha guardada.</div>
              <button className="primary-btn" disabled={busy}>{busy ? 'Criptografando...' : 'Salvar acesso'} <ChevronRight size={17}/></button>
            </form>
          </> : <>
            <div className="modal-icon"><LockKeyhole size={21}/></div><h2>Senha adicional</h2><p className="muted">Digite a segunda senha para revelar o acesso de <b>{asking.title}</b>.</p>
            <form onSubmit={unlockItem} className="form-stack">
              <label>Segunda senha</label><input autoFocus type="password" value={secondPassword} onChange={e => setSecondPassword(e.target.value)} placeholder="Digite a segunda senha" />
              <button className="primary-btn">Desbloquear senha <ChevronRight size={17}/></button>
            </form>
          </>}
        </div>
      </div>}
    </main>
  );
}

function useSessionPassword() {
  const [password, setPassword] = useState('');
  return { current: password, set: setPassword };
}