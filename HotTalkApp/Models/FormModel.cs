using System.ComponentModel.DataAnnotations;

namespace HotTalkApp.Models
{
    public class FormModel
    {
        [Required]
        public string Name { get; set; }
    }
}
