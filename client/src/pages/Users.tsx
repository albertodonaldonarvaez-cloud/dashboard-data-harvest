import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, Shield, Edit, Trash2, Plus, UserPlus } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [newRole, setNewRole] = useState<'admin' | 'editor' | 'viewer' | 'user'>('viewer');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  
  // Create user form state
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer' | 'user',
  });

  const utils = trpc.useUtils();

  // Fetch users
  const { data: users, isLoading } = trpc.users.list.useQuery();

  // Update role mutation
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Rol actualizado exitosamente');
      utils.users.list.invalidate();
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar el rol');
    },
  });

  const handleUpdateRole = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser,
        role: newRole,
      });
    }
  };

  const handleCreateUser = () => {
    if (!newUserData.name || !newUserData.email) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    // In a real system, this would call a backend endpoint
    // For now, we'll show a message that users are created via OAuth
    toast.info('Los usuarios se crean automáticamente al iniciar sesión por primera vez. Puedes cambiar su rol después.');
    setShowCreateDialog(false);
    setNewUserData({ name: '', email: '', role: 'viewer' });
  };

  const handleDeleteUser = () => {
    if (!deleteUserId) return;

    // In a real system, this would call a backend endpoint
    toast.info('La eliminación de usuarios está deshabilitada por seguridad. Puedes cambiar su rol a "viewer" para restringir acceso.');
    setDeleteUserId(null);
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      admin: 'destructive',
      editor: 'default',
      viewer: 'secondary',
      user: 'outline',
    };

    return (
      <Badge variant={variants[role] || 'outline'} className="capitalize">
        {role}
      </Badge>
    );
  };

  const getRoleIcon = (role: string) => {
    return <Shield className="w-4 h-4 mr-2" />;
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24 flex items-center justify-center">
        <GlassCard className="p-8 text-center max-w-md">
          <Shield className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-emerald-800 mb-2">Acceso Restringido</h2>
          <p className="text-emerald-600">Solo los administradores pueden gestionar usuarios.</p>
        </GlassCard>
        <NavigationMenu />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto py-8 max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard className="p-6 mb-6 text-center" hover={false}>
            <UsersIcon className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
              Gestión de Usuarios
            </h1>
            <p className="text-emerald-700">Administra roles y permisos de usuarios</p>
          </GlassCard>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard className="p-6" hover={false}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-emerald-800">
                {users?.length || 0} usuarios registrados
              </h3>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Usuario
              </Button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : users && users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-white/50">
                        <TableCell className="font-medium">{user.name || '-'}</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell>
                          {user.lastSignedIn 
                            ? new Date(user.lastSignedIn).toLocaleDateString('es-ES')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user.id);
                                setNewRole(user.role);
                              }}
                              disabled={user.id === currentUser.id}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteUserId(user.id)}
                              disabled={user.id === currentUser.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-emerald-600">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Role Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassCard className="p-6 mt-6" hover={false}>
            <h3 className="text-lg font-bold text-emerald-800 mb-4">Roles y Permisos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  {getRoleIcon('admin')}
                  <span className="font-semibold text-emerald-900">Administrador</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Acceso completo al sistema, puede gestionar usuarios, editar y eliminar datos.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  {getRoleIcon('editor')}
                  <span className="font-semibold text-emerald-900">Editor</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Puede crear y editar registros de cosecha, pero no eliminar ni gestionar usuarios.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  {getRoleIcon('viewer')}
                  <span className="font-semibold text-emerald-900">Visualizador</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Solo puede ver datos y estadísticas, sin permisos de edición.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  {getRoleIcon('user')}
                  <span className="font-semibold text-emerald-900">Usuario</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Usuario básico con acceso limitado al sistema.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Agregar Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Los usuarios se crean automáticamente al iniciar sesión. Esta función es informativa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="juan@ejemplo.com"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select 
                value={newUserData.role} 
                onValueChange={(value: any) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Seleccionar nuevo rol</label>
            <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Visualizador</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Por seguridad, la eliminación física de usuarios está deshabilitada. 
              Se recomienda cambiar el rol a "viewer" para restringir el acceso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NavigationMenu />
    </div>
  );
};

export default Users;
