import { InstagramPost } from '../types';

// NOTE: In a production environment with a backend, you would use the Instagram Graph API here.
// Since this is a client-side only app, we simulate the data to avoid CORS issues and Token management complexity.

const MOCK_POSTS: InstagramPost[] = [
  {
    id: '1',
    username: 'estilo_urbano',
    userAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=60',
    likes: 124,
    caption: 'Estrenando mi diseño único. La calidad es increíble 🔥 #inkfluencia #custom #style',
    timestamp: 'Hace 2 horas'
  },
  {
    id: '2',
    username: 'sofia.designs',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0815a011b53?w=800&auto=format&fit=crop&q=60',
    likes: 89,
    caption: 'Crear, diseñar y vestir. Gracias @inkfluencia por hacerlo realidad ✨ #inkfluencia #art',
    timestamp: 'Hace 5 horas'
  },
  {
    id: '3',
    username: 'marcos_skate',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=60',
    likes: 256,
    caption: 'Lista para el torneo. Negra como mi alma 🛹 #inkfluencia #skatelife',
    timestamp: 'Hace 1 día'
  },
  {
    id: '4',
    username: 'laura_creative',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=60',
    likes: 45,
    caption: 'Un regalo perfecto para él. Le encantó el estampado personalizado 🎁 #inkfluencia',
    timestamp: 'Hace 1 día'
  },
  {
    id: '5',
    username: 'david_tech',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=60',
    likes: 112,
    caption: 'Viernes casual en la oficina con mi nueva camiseta favorita. #inkfluencia #devlife',
    timestamp: 'Hace 2 días'
  },
  {
    id: '6',
    username: 'color_vibes',
    userAvatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&auto=format&fit=crop&q=60',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a302d27460ae?w=800&auto=format&fit=crop&q=60',
    likes: 340,
    caption: 'Simplemente obsesionada con este fit. 💖 #inkfluencia #fashion #ootd',
    timestamp: 'Hace 3 días'
  }
];

export const getInstagramPosts = async (): Promise<InstagramPost[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_POSTS);
    }, 800);
  });
};