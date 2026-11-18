import { Link } from 'react-router-dom';
import { initials } from '@/lib/format';
import { ui } from '@/lib/ui';

export function ProfileChip({ nickname }: { nickname: string }) {
  return (
    <Link to="/settings" aria-label={`Профіль ${nickname}`} className={ui.profileChip.link}>
      <span className={ui.profileChip.avatar} aria-hidden="true">
        {initials(nickname)}
      </span>
      <span className={ui.profileChip.name}>{nickname}</span>
    </Link>
  );
}
