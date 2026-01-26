import { useState, useEffect } from "react";
import { MainLayout } from "../components/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Bell, CheckCheck, Dumbbell, Info, CheckCircle } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data);
    } catch (error) {
      toast.error("Erro ao carregar notificações");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error("Erro ao marcar como lida");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success("Todas notificações marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar notificações");
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "workout":
        return <Dumbbell className="w-5 h-5 text-primary" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in" data-testid="notifications-page">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
              Notificações
            </h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 
                ? `${unreadCount} notificação${unreadCount !== 1 ? 'ões' : ''} não lida${unreadCount !== 1 ? 's' : ''}`
                : "Todas as notificações lidas"
              }
            </p>
          </div>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={markAllAsRead}
              className="gap-2"
              data-testid="mark-all-read-btn"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`p-4 flex items-start gap-4 transition-colors cursor-pointer hover:bg-secondary/30 animate-slide-in ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div className={`p-2 rounded-lg ${
                      notification.type === "workout" ? "bg-primary/20" : 
                      notification.type === "success" ? "bg-green-500/20" : "bg-cyan-500/20"
                    }`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold ${!notification.read ? "text-white" : "text-muted-foreground"}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
