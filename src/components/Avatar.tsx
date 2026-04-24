import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/core/domain/entities';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const PX: Record<Size, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 96 };

interface AvatarProps {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'handle'>;
  size?: Size;
  linkToProfile?: boolean;
  ring?: boolean;
  className?: string;
}

export function Avatar({ user, size = 'md', linkToProfile = false, ring = false, className = '' }: AvatarProps) {
  const px = PX[size];
  const img = (
    <span
      className={`inline-block rounded-full overflow-hidden ${ring ? 'ring-2 ring-primary/70 ring-offset-2 ring-offset-background' : ''} ${className}`}
      style={{ width: px, height: px }}
    >
      <Image src={user.avatar} alt={user.name} width={px} height={px} className="object-cover w-full h-full" />
    </span>
  );
  if (linkToProfile) {
    return (
      <Link href={`/profile/${user.id}`} aria-label={`Perfil de ${user.name}`}>
        {img}
      </Link>
    );
  }
  return img;
}
