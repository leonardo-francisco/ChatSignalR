using Microsoft.AspNetCore.SignalR;
using HotTalkApp.Models;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;

namespace HotTalkApp.Hub
{
    [Authorize]
    public class ChatHub : Microsoft.AspNetCore.SignalR.Hub
    {
        private static readonly ConcurrentDictionary<string, User> Users =
            new ConcurrentDictionary<string, User>(StringComparer.InvariantCultureIgnoreCase);

        public async Task SendAll(string message)
        {
            string sender = Context.User.Identity.Name;
            await Clients.All.SendAsync("received", new { sender = sender, message = message, isPrivate = false });
        }

        public async Task SendPrivate(string message, string to)
        {
            if (Users.TryGetValue(to, out User receiver))
            {
                User sender = GetUser(Context.User.Identity.Name);

                IEnumerable<string> allReceivers;
                lock (receiver.ConnectionIds)
                {
                    lock (sender.ConnectionIds)
                    {
                        allReceivers = receiver.ConnectionIds.Concat(sender.ConnectionIds);
                    }
                }

                foreach (var cid in allReceivers)
                {
                    await Clients.Client(cid).SendAsync("received", new { sender = sender.Name, message = message, isPrivate = true });
                }
            }
        }

        public IEnumerable<string> GetConnectedUsers()
        {
            return Users.Where(x =>
            {
                lock (x.Value.ConnectionIds)
                {
                    return !x.Value.ConnectionIds.Contains(Context.ConnectionId, StringComparer.InvariantCultureIgnoreCase);
                }
            }).Select(x => x.Key);
        }

        public override async Task OnConnectedAsync()
        {
            string userName = Context.User.Identity.Name;
            string connectionId = Context.ConnectionId;

            var user = Users.GetOrAdd(userName, _ => new User
            {
                Name = userName,
                ConnectionIds = new HashSet<string>()
            });

            lock (user.ConnectionIds)
            {
                user.ConnectionIds.Add(connectionId);

                if (user.ConnectionIds.Count == 1)
                {
                    Clients.Others.SendAsync("userConnected", userName);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            string userName = Context.User.Identity.Name;
            string connectionId = Context.ConnectionId;

            if (Users.TryGetValue(userName, out User user))
            {
                lock (user.ConnectionIds)
                {
                    user.ConnectionIds.RemoveWhere(cid => cid.Equals(connectionId));

                    if (!user.ConnectionIds.Any())
                    {
                        Users.TryRemove(userName, out _);
                        Clients.Others.SendAsync("userDisconnected", userName);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        private User GetUser(string username)
        {
            Users.TryGetValue(username, out User user);
            return user;
        }
    }
}
