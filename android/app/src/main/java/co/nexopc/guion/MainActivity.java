package co.nexopc.guion;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

/**
 * Pantalla principal de NEXO Guion.
 * Arreglo del teclado: desde Android 15 la app ocupa toda la pantalla y Android
 * ya NO la encoge cuando sale el teclado. Aquí lo hacemos nosotros:
 * la app deja espacio para las barras del sistema y, cuando sale el teclado,
 * se encoge justo hasta su borde (así nunca tapa lo que escribes).
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Mismo comportamiento en todos los Android (viejos y nuevos)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        View webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            Insets barras = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets teclado = insets.getInsets(WindowInsetsCompat.Type.ime());

            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            lp.leftMargin = barras.left;
            lp.topMargin = barras.top;
            lp.rightMargin = barras.right;
            // Abajo: lo que sea más alto, la barra de navegación o el teclado
            lp.bottomMargin = Math.max(barras.bottom, teclado.bottom);
            v.setLayoutParams(lp);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
