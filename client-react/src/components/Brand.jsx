import { Rocket } from 'lucide-react';
export default function Brand({ compact = false }) { return <div className="brand"><span className="brand-mark"><Rocket size={19}/></span>{!compact && <span>dev<span className="brand-accent">pilot</span></span>}</div>; }
