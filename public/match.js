$("select[name='league']").change(function()
{
    alert("League change detected...");
    if ($("select[name='league'] :selected").val())
    {
        $.ajax({
            url: '/matches/?leagueId=' + $("select[name='league'] :selected").val(),
            type: 'GET'
        });
    }
});