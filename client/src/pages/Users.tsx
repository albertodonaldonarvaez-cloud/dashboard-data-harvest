import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users as UsersIcon, UserPlus, Trash2, Shield, Key, Eye, EyeOff, Edit } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import NavigationMenu from '@/components/NavigationMenu';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<'admin' | 'editor' | 'viewer' | 'user'>('viewer');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'viewer' as 'admin' | 'editor' | 'viewer' | 'user',
  });
  const [newPassword, setNewPassword] = useState('');

  const utils = trpc.useUtils();

  // Check if user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Fetch users (only if admin)
  const { data: users, isLoading } = trpc.users.list.useQuery(undefined, {
    enabled: isAdmin,
  });

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-emerald-50/30 to-green-50 relative overflow-hidden pb-24 flex items-center justify-center">
        <GlassCard className="p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            Solo los administradores pueden acceder a la gestión de usuarios.
          </p>
          <Button onClick={() => window.history.back()} variant="outline">
            Volver
          </Button>
        </GlassCard>
      </div>
    );
  }

  // Create user mutation
  const createMutation = trpc.users.createWithPassword.useMutation({
    onSuccess: () => {
      toast.success('Usuario creado exitosamente');
      utils.users.list.invalidate();
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '', name: '', role: 'viewer' });
      setShowPassword(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al crear usuario');
    },
  });

  // Note: Delete user functionality removed for security
  // Users should be deactivated by changing role instead

  // Update role mutation
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success('Rol actualizado exitosamente');
      utils.users.list.invalidate();
      setEditRoleDialogOpen(false);
      setSelectedUserId(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al actualizar rol');
    },
  });

  // Reset password mutation
  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      toast.success('Contraseña restablecida exitosamente');
      setResetPasswordDialogOpen(false);
      setSelectedUserId(null);
      setNewPassword('');
      setShowNewPassword(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Error al restablecer contraseña');
    },
  });

  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    if (newUser.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    createMutation.mutate(newUser);
  };

  const handleDeleteUser = (userId: number, userName: string) => {
    toast.info('Por seguridad, la eliminación de usuarios está deshabilitada. Cambia el rol a "viewer" para restringir acceso.');
  };

  const handleUpdateRole = () => {
    if (!selectedUserId) return;

    updateRoleMutation.mutate({
      userId: selectedUserId,
      role: selectedUserRole,
    });
  };

  const handleResetPassword = () => {
    if (!selectedUserId) return;

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    resetPasswordMutation.mutate({
      userId: selectedUserId,
      newPassword,
    });
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
        {role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : role === 'viewer' ? 'Visor' : 'Usuario'}
      </Badge>
    );
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
          <GlassCard className="p-6 mb-6" hover={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UsersIcon className="w-8 h-8 text-emerald-500" />
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    Gestión de Usuarios
                  </h1>
                  <p className="text-emerald-700">Administra usuarios y permisos del sistema</p>
                </div>
              </div>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <GlassCard className="p-6" hover={false}>
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
                        <TableCell className="font-medium text-emerald-900">
                          {user.name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="text-emerald-700">
                          {user.email || 'Sin email'}
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell className="text-emerald-600 text-sm">
                          {user.lastSignedIn ? format(new Date(user.lastSignedIn), 'dd MMM yyyy', { locale: es }) : 'Nunca'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUserRole(user.role);
                                setEditRoleDialogOpen(true);
                              }}
                              title="Editar rol"
                              disabled={user.id === currentUser?.id}
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setResetPasswordDialogOpen(true);
                              }}
                              title="Restablecer contraseña"
                            >
                              <Key className="w-4 h-4 text-orange-600" />
                            </Button>
                            {user.id !== currentUser?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.id, user.name || user.email || 'usuario')}
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
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
                  <Shield className="w-4 h-4 mr-2 text-red-600" />
                  <span className="font-semibold text-emerald-900">Administrador</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Acceso completo al sistema, puede gestionar usuarios, editar y eliminar datos.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="font-semibold text-emerald-900">Editor</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Puede crear y editar registros de cosecha, pero no eliminar ni gestionar usuarios.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="font-semibold text-emerald-900">Visualizador</span>
                </div>
                <p className="text-sm text-emerald-600">
                  Solo puede ver datos y estadísticas, sin permisos de edición.
                </p>
              </div>
              <div className="p-4 bg-white/50 rounded-xl">
                <div className="flex items-center mb-2">
                  <Shield className="w-4 h-4 mr-2 text-green-600" />
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
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Ingresa los datos del nuevo usuario con email y contraseña.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="usuario@ejemplo.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Contraseña *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visor</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-emerald-500 to-green-500"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo rol para el usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="newRole">Nuevo Rol</Label>
            <Select value={selectedUserRole} onValueChange={(value: any) => setSelectedUserRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Visor</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600"
            >
              {updateRoleMutation.isPending ? 'Actualizando...' : 'Actualizar Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa la nueva contraseña para el usuario seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newPassword">Nueva Contraseña *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
              className="bg-gradient-to-r from-orange-500 to-orange-600"
            >
              {resetPasswordMutation.isPending ? 'Restableciendo...' : 'Restablecer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NavigationMenu />
    </div>
  );
};

export default Users;
