using System.ComponentModel.DataAnnotations;

namespace HotTalkApp.Models
{
    public class FormModel
    {
        [Required(ErrorMessage = "Por favor, forneça um nome.")]
        public string Name { get; set; }
    }
}
